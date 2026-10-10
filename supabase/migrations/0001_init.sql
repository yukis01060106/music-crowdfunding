-- Oto Fund（オトファンド）の本番のデータベース（Supabase / PostgreSQL）
-- デモでブラウザに保存しているもの（src/lib/demo-store.ts・src/lib/admin-store.ts）を、ここに置き換える。
--
-- 方針
-- - すべてのテーブルで行の権限（RLS）を有効にし、許可したことだけができるようにする
-- - 金額・決済の状態は Stripe の Webhook（サーバー）だけが書き込む。ブラウザからは書かない
-- - 運営の操作の記録（admin_audit_logs）は追記だけ。書き換えと削除はだれにもできない
-- - 役割（supporter / creator / admin）は profiles.role に持ち、本人は書き換えられない

create extension if not exists pgcrypto;

-- ───── 役割とプロフィール ─────

create type public.user_role as enum ('supporter', 'creator', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role public.user_role not null default 'supporter',
  -- 利用停止（運営が設定）
  suspended_at timestamptz,
  suspended_reason text,
  notify_updates boolean not null default true,
  notify_ending boolean not null default true,
  notify_news boolean not null default false,
  notify_fes boolean not null default true,
  created_at timestamptz not null default now()
);

-- 運営か（RLS の中で使う）。security definer にして、profiles の RLS を通さずに役割だけ読む
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and suspended_at is null);
$$;

-- サーバー（service role）や SQL Editor からの操作か。運営の画面のサーバー処理・Webhook・初期設定で使う
create or replace function public.is_service() returns boolean
language sql stable as $$
  select coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin');
$$;

-- 新しいユーザーが登録されたら、プロフィールを作る（役割は必ず supporter から）
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'ゲスト'), 40));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 本人は表示名と通知の設定だけ変えられる（役割・停止は変えられない）
create or replace function public.guard_profile_update() returns trigger
language plpgsql as $$
begin
  if public.is_service() then return new; end if;
  if not public.is_admin() and (new.role is distinct from old.role or new.suspended_at is distinct from old.suspended_at or new.suspended_reason is distinct from old.suspended_reason) then
    raise exception 'role and suspension can only be changed by admins';
  end if;
  return new;
end;
$$;
create trigger guard_profile_update before update on public.profiles for each row execute function public.guard_profile_update();

-- ───── アーティストとプロジェクト ─────

create table public.artists (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  bio text not null default '',
  genres text[] not null default '{}',
  types text[] not null default '{}',
  verified boolean not null default false,
  photo_path text,
  catchline text not null default '',
  links jsonb not null default '[]',
  -- Stripe Connect の口座（振込先）。本人確認と振込の可否は Stripe から取得する
  stripe_account_id text unique,
  created_at timestamptz not null default now()
);

create type public.project_status as enum ('draft', 'in_review', 'approved', 'live', 'succeeded', 'failed');
create type public.funding_model as enum ('all_or_nothing', 'all_in');
create type public.goal_type as enum ('amount', 'participants');

create table public.projects (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,60}$'),
  artist_id text not null references public.artists (id),
  title text not null check (char_length(title) <= 80),
  catchcopy text not null default '',
  genre text not null,
  status public.project_status not null default 'draft',
  funding_model public.funding_model not null,
  goal_type public.goal_type not null,
  goal integer not null check (goal > 0),
  start_at timestamptz,
  end_at timestamptz,
  -- 本文・予算・スケジュールなど、表示用のまとまり
  content jsonb not null default '{}',
  cover_path text,
  -- 運営による掲載の停止
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects (status, end_at);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null references public.projects (slug) on delete cascade,
  title text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  kind text not null,
  stock_limit integer check (stock_limit > 0),
  delivery_estimate text not null default '',
  requires_shipping boolean not null default false,
  sort_order integer not null default 0
);

-- 審査の結果（運営が書く）
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null references public.projects (slug) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  decision text not null check (decision in ('approved', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);

-- ───── 支援と決済（Stripe の Webhook だけが書き込む） ─────

create type public.payment_state as enum ('pending', 'awaiting', 'charged', 'failed', 'expired', 'refunded');

create table public.backings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  project_slug text not null references public.projects (slug),
  reward_id uuid not null references public.rewards (id),
  quantity integer not null default 1 check (quantity between 1 and 10),
  tip integer not null default 0 check (tip >= 0),
  amount integer not null check (amount >= 0),
  payment_method text not null,
  state public.payment_state not null default 'pending',
  comment text check (char_length(comment) <= 500),
  -- Stripe の記録（同じ決済を二重に記録しない）
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  stripe_payment_method_id text,
  voucher_url text,
  voucher_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.backings (project_slug, state);
create index on public.backings (user_id);

-- お届け先は別のテーブルに分け、実行者には発送に必要な分だけを見せる
create table public.shipping_addresses (
  backing_id uuid primary key references public.backings (id) on delete cascade,
  name text not null,
  postal_code text not null,
  address text not null,
  phone text not null
);

create table public.shipments (
  backing_id uuid primary key references public.backings (id) on delete cascade,
  shipped_at timestamptz not null default now(),
  tracking_number text
);

-- ───── メンバーシップ ─────

create table public.membership_plans (
  id text not null,
  artist_id text not null references public.artists (id) on delete cascade,
  name text not null,
  price integer not null check (price >= 100),
  perks text[] not null default '{}',
  member_limit integer,
  primary key (artist_id, id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  artist_id text not null references public.artists (id),
  plan_id text not null,
  stripe_subscription_id text unique,
  status text not null default 'active' check (status in ('active', 'canceling', 'canceled', 'past_due')),
  joined_at timestamptz not null default now(),
  cancel_at timestamptz,
  -- 同じアーティストに二重に加入しない
  unique (user_id, artist_id)
);

-- ───── 活動報告・メッセージ・運営への連絡 ─────

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null references public.projects (slug) on delete cascade,
  title text not null check (char_length(title) <= 200),
  body text not null check (char_length(body) <= 5000),
  backers_only boolean not null default false,
  published_at timestamptz not null default now()
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null references public.projects (slug),
  supporter_id uuid not null references public.profiles (id),
  subject text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  kind text not null check (kind in ('inquiry', 'report', 'refund')),
  subject text not null check (char_length(subject) <= 200),
  body text not null check (char_length(body) <= 5000),
  from_name text,
  from_email text,
  target_slug text references public.projects (slug),
  backing_id uuid references public.backings (id),
  cause text check (cause in ('duplicate', 'creator', 'supporter')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  -- 同じ支援への返金の相談は1件まで
  unique (backing_id, kind)
);

create table public.inquiry_replies (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

-- 返金（運営が判断し、Stripe の Refund と Webhook で確定する）
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid unique references public.inquiries (id),
  backing_id uuid not null references public.backings (id),
  decision text not null check (decision in ('processing', 'refunded', 'declined')),
  amount integer check (amount > 0),
  note text,
  stripe_refund_id text unique,
  decided_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ───── 運営の操作の記録（追記だけ） ─────

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  operator_id uuid not null references public.profiles (id),
  action text not null,
  target text not null,
  detail text,
  ip inet,
  created_at timestamptz not null default now()
);

-- ───── 行の権限（RLS） ─────

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.projects enable row level security;
alter table public.rewards enable row level security;
alter table public.reviews enable row level security;
alter table public.backings enable row level security;
alter table public.shipping_addresses enable row level security;
alter table public.shipments enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.project_updates enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_replies enable row level security;
alter table public.refunds enable row level security;
alter table public.admin_audit_logs enable row level security;

-- プロフィール：本人と運営が読める。本人は自分のものだけ更新できる（役割はトリガーで守る）
create policy "profiles: self or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: self update" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- アーティスト：だれでも読める。本人と運営が更新できる
create policy "artists: public read" on public.artists for select using (true);
create policy "artists: creator insert" on public.artists for insert with check (
  public.is_admin() or (owner_id = auth.uid() and verified = false and stripe_account_id is null
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'creator' and p.suspended_at is null))
);
create policy "artists: owner update" on public.artists for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "artists: admin delete" on public.artists for delete using (public.is_admin());

-- 本人確認・振込先（Stripe Connect）・持ち主・ID は、本人には変えられない（運営かサーバーだけ）
create or replace function public.guard_artist_update() returns trigger
language plpgsql as $$
begin
  if public.is_service() or public.is_admin() then return new; end if;
  if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.verified is distinct from old.verified or new.stripe_account_id is distinct from old.stripe_account_id then
    raise exception 'id, owner, verification and payout account can only be changed by admins';
  end if;
  return new;
end;
$$;
create trigger guard_artist_update before update on public.artists for each row execute function public.guard_artist_update();

-- 実行者か（そのプロジェクトのアーティストの持ち主）
create or replace function public.owns_project(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p join public.artists a on a.id = p.artist_id where p.slug = p_slug and a.owner_id = auth.uid());
$$;

-- 自分のプロジェクトへの支援か（支援の行は実行者に見せないので、RLS を通さずに確かめる）
create or replace function public.owns_backing(p_backing uuid, p_require_charged boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.backings b
    join public.projects p on p.slug = b.project_slug
    join public.artists a on a.id = p.artist_id
    where b.id = p_backing and a.owner_id = auth.uid() and (not p_require_charged or b.state = 'charged')
  );
$$;

-- プロジェクト：公開中（停止していない）はだれでも、下書き・審査中は持ち主と運営だけ読める
create policy "projects: public read" on public.projects for select
  using ((status in ('live', 'succeeded', 'failed') and suspended_at is null) or public.owns_project(slug) or public.is_admin());
-- 持ち主は下書きだけ書ける（公開・停止・状態の変更は運営かサーバーの処理）
create policy "projects: owner draft insert" on public.projects for insert with check (status = 'draft' and exists (select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid()));
create policy "projects: owner draft update" on public.projects for update
  using (public.owns_project(slug) and status = 'draft')
  with check (status in ('draft', 'in_review') and exists (select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid()));

create or replace function public.guard_project_update() returns trigger
language plpgsql as $$
begin
  if public.is_service() or public.is_admin() then
    new.updated_at := now();
    return new;
  end if;
  if new.slug is distinct from old.slug or new.artist_id is distinct from old.artist_id or new.created_at is distinct from old.created_at
     or new.suspended_at is distinct from old.suspended_at or new.suspended_reason is distinct from old.suspended_reason then
    raise exception 'slug, artist, suspension and created_at can only be changed by admins';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_project_update before update on public.projects for each row execute function public.guard_project_update();
create policy "projects: admin all" on public.projects for all using (public.is_admin()) with check (public.is_admin());

create policy "rewards: read with project" on public.rewards for select using (exists (select 1 from public.projects p where p.slug = project_slug));
create policy "rewards: owner write draft" on public.rewards for all
  using (public.owns_project(project_slug) and exists (select 1 from public.projects p where p.slug = project_slug and p.status = 'draft'))
  with check (public.owns_project(project_slug) and exists (select 1 from public.projects p where p.slug = project_slug and p.status = 'draft'));

create policy "reviews: owner or admin read" on public.reviews for select using (public.owns_project(project_slug) or public.is_admin());
create policy "reviews: admin insert" on public.reviews for insert with check (public.is_admin() and reviewer_id = auth.uid());

-- 支援：本人・そのプロジェクトの実行者・運営が読める。書き込みは Webhook（service role）だけ
create policy "backings: own or admin read" on public.backings for select using (user_id = auth.uid() or public.is_admin());

-- お届け先：本人と運営。実行者は発送の画面のサーバー処理（service role）から必要な分だけ受け取る
create policy "shipping: owner read" on public.shipping_addresses for select using (exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid()) or public.is_admin());
create policy "shipping: owner write" on public.shipping_addresses for insert with check (exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid()));
create policy "shipping: owner update" on public.shipping_addresses for update
  using (exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid() and not exists (select 1 from public.shipments sh where sh.backing_id = b.id)))
  with check (exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid()));

create policy "shipments: read" on public.shipments for select using (exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid()) or public.owns_backing(backing_id) or public.is_admin());
create policy "shipments: creator write" on public.shipments for all
  using (public.owns_backing(backing_id, true))
  with check (public.owns_backing(backing_id, true));

create policy "plans: public read" on public.membership_plans for select using (true);
create policy "plans: owner write" on public.membership_plans for all using (exists (select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid())) with check (exists (select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid()));

create policy "memberships: read" on public.memberships for select using (user_id = auth.uid() or exists (select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid()) or public.is_admin());

-- 活動報告：公開分はだれでも。支援者限定は、そのプロジェクトの支援者・実行者・運営だけ
create policy "updates: read" on public.project_updates for select using (
  public.owns_project(project_slug) or public.is_admin()
  or (
    exists (select 1 from public.projects p where p.slug = project_updates.project_slug and p.status in ('live', 'succeeded', 'failed') and p.suspended_at is null)
    and (not backers_only or exists (select 1 from public.backings b where b.project_slug = project_updates.project_slug and b.user_id = auth.uid() and b.state in ('charged', 'pending', 'awaiting')))
  )
);
create policy "updates: owner write" on public.project_updates for all using (public.owns_project(project_slug)) with check (public.owns_project(project_slug));

create policy "threads: participants" on public.threads for select using (supporter_id = auth.uid() or public.owns_project(project_slug) or public.is_admin());
create policy "threads: supporter create" on public.threads for insert with check (
  supporter_id = auth.uid() and exists (select 1 from public.projects p where p.slug = project_slug and p.status in ('live', 'succeeded', 'failed') and p.suspended_at is null)
);
create policy "messages: participants read" on public.messages for select using (exists (select 1 from public.threads t where t.id = thread_id and (t.supporter_id = auth.uid() or public.owns_project(t.project_slug) or public.is_admin())));
create policy "messages: participants write" on public.messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from public.threads t where t.id = thread_id and (t.supporter_id = auth.uid() or public.owns_project(t.project_slug)))
);

-- 運営への連絡：本人が送れて、本人と運営が読める。返金の相談は自分の支援だけ
create policy "inquiries: own read" on public.inquiries for select using (user_id = auth.uid() or public.is_admin());
create policy "inquiries: own insert" on public.inquiries for insert with check (
  status = 'open'
  and (user_id is null or user_id = auth.uid())
  and (backing_id is null or exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid() and b.state = 'charged'))
);
create policy "inquiries: admin update" on public.inquiries for update using (public.is_admin());
create policy "replies: read" on public.inquiry_replies for select using (exists (select 1 from public.inquiries i where i.id = inquiry_id and (i.user_id = auth.uid() or public.is_admin())));
create policy "replies: admin write" on public.inquiry_replies for insert with check (public.is_admin() and author_id = auth.uid());

create policy "refunds: read" on public.refunds for select using (exists (select 1 from public.backings b where b.id = backing_id and b.user_id = auth.uid()) or public.is_admin());

-- 操作の記録：運営だけが読めて、追記だけできる（update / delete のポリシーは作らない＝できない）
create policy "audit: admin read" on public.admin_audit_logs for select using (public.is_admin());
create policy "audit: admin append" on public.admin_audit_logs for insert with check (public.is_admin() and operator_id = auth.uid());
revoke update, delete, truncate on public.admin_audit_logs from anon, authenticated, service_role;

-- ───── 集計（公開ページの数字） ─────

-- 支援総額と支援者の数は、有効な支援（決済済み・決済予定）から数える。返金・期限切れ・失敗は入れない。
-- だれが支援したかは見せず、合計だけを公開するため、ビューの持ち主の権限で集計する（支援のテーブルの RLS は通さない）
create or replace view public.project_totals as
  select p.slug,
         coalesce(sum(b.amount) filter (where b.state in ('charged', 'pending', 'awaiting')), 0)::integer as raised,
         count(distinct coalesce(b.user_id::text, b.id::text)) filter (where b.state in ('charged', 'pending', 'awaiting'))::integer as backers
  from public.projects p
  left join public.backings b on b.project_slug = p.slug
  where p.status in ('live', 'succeeded', 'failed') and p.suspended_at is null
  group by p.slug;
grant select on public.project_totals to anon, authenticated;

-- 実行者に渡す支援の一覧（列を絞る：Stripe の ID・払込票の URL・支払い方法は見せない）。
-- ビューの持ち主の権限で読むので、中で「自分のプロジェクトか」を必ず確かめる
create or replace view public.creator_backings as
  select b.id, b.project_slug, b.reward_id, b.quantity, b.amount, b.state, b.comment, b.created_at
  from public.backings b
  join public.projects p on p.slug = b.project_slug
  join public.artists a on a.id = p.artist_id
  where a.owner_id = auth.uid();
grant select on public.creator_backings to authenticated;

-- Stripe の通知を一度だけ処理するための記録（Webhook）。サーバー（service role）だけが使う
-- processing のまま長く残った行（received_at が5分以上前）は、落ちた処理として取り直してよい
create table public.stripe_events (
  id text primary key,
  type text not null,
  status text not null default 'processing' check (status in ('processing', 'done')),
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- RPC として直接呼ばせない（ポリシーやトリガーの中からだけ使う）
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.guard_artist_update() from public, anon, authenticated;
revoke execute on function public.guard_project_update() from public, anon, authenticated;
-- RLS の中から呼ぶので authenticated には残し、ログインしていない人からは呼べないようにする
revoke execute on function public.owns_backing(uuid, boolean) from public, anon;
