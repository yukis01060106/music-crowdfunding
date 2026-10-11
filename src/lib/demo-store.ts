"use client";

import { useSyncExternalStore } from "react";
import { jstDateKey } from "./format";
import { toEmbedUrl } from "./video";

// デモ用の保存領域。ログイン・お気に入り・支援・メンバーシップ・メッセージ・設定を
// ブラウザ（localStorage）に保存して、サイト全体でつながって見えるようにする。
// TODO: Supabase を入れたら、この中身を Supabase Auth とテーブルへの読み書きに置き換える。
//       画面側は useDemo() と各アクション関数だけを使っているので、差し替えはこのファイルで済む。

export interface DemoUser {
  name: string;
  email: string;
  /** ログイン方法（表示用） */
  provider: "email" | "google" | "x";
}

export interface Backing {
  id: string;
  projectSlug: string;
  rewardId: string;
  quantity: number;
  tip: number;
  amount: number;
  backedAt: string;
  paymentMethod: string;
  comment?: string;
  /** Stripe で決済したときの Checkout Session の ID（テストモード・本番） */
  stripeSessionId?: string;
  /** All-or-Nothing で、登録したカードにまだ請求していないとき false */
  charged?: boolean;
  /** コンビニ払いで、お店での支払いを待っているとき true */
  awaitingPayment?: boolean;
  /** コンビニ払いの払込票のページと支払期限 */
  voucherUrl?: string;
  voucherExpiresAt?: string;
  /** 配送が必要なリターンのお届け先（実行者の発送の画面に出る） */
  shipping?: { name: string; postalCode: string; address: string; phone: string };
}

export interface MembershipSub {
  artistId: string;
  planId: string;
  joinedAt: string;
  /** 解約を申し込んだ日。次の更新日まで特典は使える */
  canceledAt?: string;
  /** 下位プランへの変更を申し込んだとき、次の更新日から切り替わるプラン */
  pendingPlanId?: string;
  /** Stripe で加入したときの Checkout Session の ID。解約・変更のときに本人の確認に使う */
  stripeSessionId?: string;
}

export interface ThreadMessage {
  from: "me" | "artist";
  body: string;
  at: string;
}

export interface Thread {
  id: string;
  projectSlug: string;
  subject: string;
  messages: ThreadMessage[];
  /** アーティストからの未読がある */
  unread: boolean;
}

export interface Address {
  id: string;
  name: string;
  postalCode: string;
  address: string;
  phone: string;
}

export interface DemoSettings {
  notifyUpdates: boolean;
  notifyEnding: boolean;
  notifyNews: boolean;
  notifyFes: boolean;
  addresses: Address[];
}

/** 実行者が審査に提出したプロジェクト。運営の審査キューに並ぶ */
export interface Submission {
  id: string;
  title: string;
  artist: string;
  submittedAt: string;
  goal: string;
  story: string;
  rewards: string[];
  flags: { identity: boolean; cover: boolean; minor: boolean };
  /** メッセージ動画の URL（審査で中身を確かめる） */
  messageVideoUrl?: string;
  messageText?: string;
}

/** 実行者が投稿した活動報告（プロジェクトの活動報告のページに出る） */
export interface PostedUpdate {
  id: string;
  projectSlug: string;
  title: string;
  body: string;
  backersOnly: boolean;
  publishedAt: string;
}

/**
 * 支援者から運営への連絡（お問い合わせ・通報・返金の相談）。運営の「問い合わせ・通報」と「お金の流れ」に並ぶ。
 * 運営の返信と対応の結果は admin-store に残り、マイページで見られる
 */
export interface Inquiry {
  id: string;
  kind: "inquiry" | "report" | "refund";
  subject: string;
  body: string;
  /** 対象のプロジェクト */
  targetSlug?: string;
  target?: string;
  /** 返金の相談のとき、対象の支援 */
  backingId?: string;
  amount?: number;
  /** 返金の相談の理由の種類 */
  cause?: "duplicate" | "creator" | "supporter";
  /** 送った人（お問い合わせのフォームに入れた名前とメール）。本文とは分けて持つ */
  fromName?: string;
  fromEmail?: string;
  receivedAt: string;
}

export interface DemoState {
  user: DemoUser | null;
  favorites: string[];
  backings: Backing[];
  memberships: MembershipSub[];
  threads: Thread[];
  settings: DemoSettings;
  submissions: Submission[];
  postedUpdates: PostedUpdate[];
  /** 発送済みにした支援（支援の ID → 発送した日時）。見本の支援者は "sample:◯◯" */
  shipped: Record<string, string>;
  /** 発送の追跡番号（支援の ID → 番号） */
  tracking: Record<string, string>;
  inquiries: Inquiry[];
  /** 運営からの返信・対応の結果を、支援者が読んだ数（問い合わせの ID → 読んだ返信の数＋結果） */
  seenOperator: Record<string, number>;
  /** 実行者が見本の支援者に返信したメッセージ（見本のスレッドの ID → メッセージ） */
  sampleReplies: Record<string, ThreadMessage[]>;
}

const KEY = "otofund:demo";

/** 初めて開いた人にも中身が見えるよう、支援やメンバーシップを少し入れておく */
export const INITIAL_STATE: DemoState = {
  user: null,
  favorites: ["mio-aoki-live-album"],
  backings: [
    { id: "bk-1", projectSlug: "hoshizora-1st-album", rewardId: "r-cd", quantity: 1, tip: 0, amount: 4000, backedAt: "2026-09-03T12:10:00+09:00", paymentMethod: "クレジットカード" },
    { id: "bk-2", projectSlug: "neon-kaiju-1000", rewardId: "r-ticket", quantity: 1, tip: 500, amount: 4000, backedAt: "2026-09-18T09:30:00+09:00", paymentMethod: "PayPay" },
  ],
  memberships: [
    { artistId: "hoshizora-radio", planId: "m-crew", joinedAt: "2026-04-12T20:00:00+09:00" },
    { artistId: "yumenoa", planId: "m-listener", joinedAt: "2026-08-30T22:10:00+09:00" },
  ],
  threads: [
    {
      id: "th-1",
      projectSlug: "hoshizora-1st-album",
      subject: "サインの宛名について",
      unread: true,
      messages: [
        { from: "me", body: "サインに名前を入れてもらうことはできますか？", at: "2026-09-20T19:05:00+09:00" },
        { from: "artist", body: "もちろんです！発送前にお名前の確認フォームをお送りしますね。", at: "2026-09-21T10:30:00+09:00" },
      ],
    },
  ],
  settings: { notifyUpdates: true, notifyEnding: true, notifyNews: false, notifyFes: true, addresses: [] },
  submissions: [],
  postedUpdates: [],
  // 見本の支援者のうち、もう発送したもの
  shipped: { "sample:s3": "2026-09-30T15:00:00+09:00" },
  tracking: { "sample:s3": "1234-5678-9012" },
  inquiries: [],
  seenOperator: {},
  sampleReplies: {},
};

let cache: DemoState | null = null;
const listeners = new Set<() => void>();

/** 保存する形の版。形を変えたら上げて、古い値は捨てる */
const VERSION = 1;

/**
 * 保存された値を検証して、形の合わない項目は初期値に戻す（古い版の値や、手で書き換えられた値で画面が落ちないように）。
 * 注意：ここの値はブラウザで自由に書き換えられる。本番では、金額・支援の有無・ログイン中のユーザーを必ずサーバーで確かめる。
 */
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown) => isStr(v) && !Number.isNaN(Date.parse(v));
/** 保存された値のうち、自分自身が持つキーだけを読む（"constructor" などのキーで関数を拾わないように） */
export function own<T>(rec: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(rec, key) ? rec[key] : undefined;
}
const clip = (v: string, n: number) => v.slice(0, n);
const isPlainObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isShipping = (v: unknown) => v === undefined || (!!v && typeof v === "object" && ["name", "postalCode", "address", "phone"].every((k) => isStr((v as Record<string, unknown>)[k])));
const isBacking = (x: Record<string, unknown>) =>
  isShipping(x.shipping) && (x.comment === undefined || isStr(x.comment)) &&
  isStr(x.id) && isStr(x.projectSlug) && isStr(x.rewardId) && Number.isFinite(x.amount) && Number.isInteger(x.quantity) && Number.isFinite(x.tip) && isStr(x.paymentMethod) && isDate(x.backedAt);
const isMembership = (x: Record<string, unknown>) => isStr(x.artistId) && isStr(x.planId) && isDate(x.joinedAt) && (x.canceledAt === undefined || isDate(x.canceledAt));
const isAddress = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.name) && isStr(x.postalCode) && isStr(x.address) && isStr(x.phone);
const isSubmission = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.title) && isStr(x.artist) && isDate(x.submittedAt) && isStr(x.goal) && isStr(x.story) && Array.isArray(x.rewards) && x.rewards.every(isStr) && !!x.flags && typeof x.flags === "object";
const isPostedUpdate = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.projectSlug) && isStr(x.title) && isStr(x.body) && typeof x.backersOnly === "boolean" && isDate(x.publishedAt);
const isInquiry = (x: Record<string, unknown>) =>
  isStr(x.id) && x.id.startsWith("my-") && (x.kind === "inquiry" || x.kind === "report" || x.kind === "refund") && isStr(x.subject) && isStr(x.body) && isDate(x.receivedAt) && (x.targetSlug === undefined || isStr(x.targetSlug)) && (x.target === undefined || isStr(x.target)) && (x.backingId === undefined || isStr(x.backingId)) && (x.amount === undefined || Number.isFinite(x.amount)) && (x.cause === undefined || x.cause === "duplicate" || x.cause === "creator" || x.cause === "supporter") && (x.fromName === undefined || isStr(x.fromName)) && (x.fromEmail === undefined || isStr(x.fromEmail));
const isThread = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.projectSlug) && isStr(x.subject) && Array.isArray(x.messages);

function sanitize(raw: unknown): DemoState {
  if (!raw || typeof raw !== "object" || (raw as { v?: unknown }).v !== VERSION) return INITIAL_STATE;
  const r = raw as Partial<DemoState>;
  // 配列の中身も、形の正しい項目だけ残す
  const arr = <T,>(v: unknown, fallback: T[], valid: (x: Record<string, unknown>) => boolean = () => true): T[] =>
    Array.isArray(v) ? (v.filter((x) => x && typeof x === "object" && valid(x as Record<string, unknown>)) as T[]) : fallback;
  const user = r.user && typeof r.user === "object" && typeof r.user.name === "string" && typeof r.user.email === "string" ? r.user : null;
  const settings = r.settings && typeof r.settings === "object" ? { ...INITIAL_STATE.settings, ...r.settings, addresses: arr(r.settings.addresses, [], isAddress) } : INITIAL_STATE.settings;
  return {
    user,
    favorites: Array.isArray(r.favorites) ? r.favorites.filter((f): f is string => typeof f === "string") : INITIAL_STATE.favorites,
    backings: arr<Backing>(r.backings, INITIAL_STATE.backings, isBacking).map((b) => ({
      ...b,
      comment: b.comment === undefined ? undefined : clip(b.comment, 500),
      shipping: b.shipping && { name: clip(b.shipping.name, 100), postalCode: clip(b.shipping.postalCode, 10), address: clip(b.shipping.address, 200), phone: clip(b.shipping.phone, 20) },
    })),
    memberships: arr(r.memberships, INITIAL_STATE.memberships, isMembership),
    threads: arr<Thread>(r.threads, INITIAL_STATE.threads, isThread).map((t) => ({ ...t, messages: arr<ThreadMessage>(t.messages, [], (m) => isStr(m.body) && isDate(m.at) && (m.from === "me" || m.from === "artist")).slice(-200).map((m) => ({ ...m, body: clip(m.body, 2000) })) })),
    settings,
    submissions: arr<Submission>(r.submissions, [], isSubmission).map((s) => ({
      ...s,
      messageVideoUrl: typeof s.messageVideoUrl === "string" && toEmbedUrl(clip(s.messageVideoUrl, 300)) ? clip(s.messageVideoUrl, 300) : undefined,
      messageText: typeof s.messageText === "string" ? clip(s.messageText, 200) : undefined,
    })),
    postedUpdates: arr<PostedUpdate>(r.postedUpdates, [], isPostedUpdate).slice(0, 200).map((u) => ({ ...u, title: clip(u.title, 200), body: clip(u.body, 5000) })),
    shipped:
      r.shipped && typeof r.shipped === "object" && !Array.isArray(r.shipped)
        ? Object.fromEntries(Object.entries(r.shipped).filter(([, v]) => isDate(v)))
        : INITIAL_STATE.shipped,
    inquiries: arr<Inquiry>(r.inquiries, [], isInquiry)
      .slice(0, 200)
      .map((i) => ({ ...i, subject: clip(i.subject, 200), body: clip(i.body, 5000), target: i.target === undefined ? undefined : clip(i.target, 200) })),
    tracking: isPlainObj(r.tracking) ? Object.fromEntries(Object.entries(r.tracking).filter(([, v]) => isStr(v)).map(([k, v]) => [k, clip(v as string, 40)])) : INITIAL_STATE.tracking,
    seenOperator: isPlainObj(r.seenOperator) ? Object.fromEntries(Object.entries(r.seenOperator).filter(([, v]) => Number.isInteger(v))) : {},
    sampleReplies: isPlainObj(r.sampleReplies)
      ? Object.fromEntries(
          Object.entries(r.sampleReplies)
            .filter(([, v]) => Array.isArray(v))
            .map(([k, v]) => [k, (v as unknown[]).filter((m): m is ThreadMessage => !!m && typeof m === "object" && isStr((m as ThreadMessage).body) && isDate((m as ThreadMessage).at) && (m as ThreadMessage).from === "artist").slice(-50)]),
        )
      : {},
  };
}

function read(): DemoState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : INITIAL_STATE;
  } catch {
    cache = INITIAL_STATE;
  }
  return cache;
}

function write(next: DemoState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...next, v: VERSION }));
  } catch {
    // 保存できない環境（プライベートブラウズなど）では、開いている間だけ覚えておく
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 保存された状態。サーバー描画時と最初の描画は INITIAL_STATE（ログアウト状態） */
export function useDemo(): DemoState {
  return useSyncExternalStore(subscribe, read, () => INITIAL_STATE);
}

/** ブラウザで描画されたか。ログイン状態に依存する表示のちらつきを防ぐ */
const noop = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

function update(fn: (s: DemoState) => DemoState) {
  write(fn(read()));
}

export const newId = () => Math.random().toString(36).slice(2, 10);

/* ───── アクション ───── */

export function login(user: DemoUser) {
  update((s) => ({ ...s, user }));
}

export function logout() {
  update((s) => ({ ...s, user: null }));
}

export function updateProfile(patch: Partial<DemoUser>) {
  update((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
}

export function toggleFavorite(slug: string) {
  update((s) => ({
    ...s,
    favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug],
  }));
}

export function addBacking(b: Omit<Backing, "id" | "backedAt">) {
  update((s) => {
    // 決済画面から戻ってページを開き直しても、同じ支援を二重に記録しない
    if (b.stripeSessionId && s.backings.some((x) => x.stripeSessionId === b.stripeSessionId)) return s;
    return { ...s, backings: [{ ...b, id: newId(), backedAt: new Date().toISOString() }, ...s.backings] };
  });
}

export function markCharged(stripeSessionId: string) {
  update((s) => ({ ...s, backings: s.backings.map((b) => (b.stripeSessionId === stripeSessionId ? { ...b, charged: true } : b)) }));
}

/**
 * 加入、またはプランの変更。上位への変更はすぐ切り替え、下位への変更は次の更新日から（pendingPlanId に入れておく）。
 * 加入日（＝毎月の更新日）は変えない。
 */
export function joinMembership(artistId: string, planId: string, change: "new" | "upgrade" | "downgrade" = "new", stripeSessionId?: string) {
  update((s) => {
    const existing = s.memberships.find((m) => m.artistId === artistId);
    // 同じ決済から戻ってきたときは、記録し直さない
    if (stripeSessionId && existing?.stripeSessionId === stripeSessionId) return s;
    const fresh: MembershipSub = { artistId, planId, joinedAt: new Date().toISOString(), stripeSessionId };
    if (!existing) return { ...s, memberships: [...s.memberships, fresh] };
    // 終了したメンバーシップに入り直すときは、今日を新しい加入日（＝更新日）にする
    if (change === "new") return { ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? fresh : m)) };
    const next: MembershipSub =
      change === "downgrade"
        ? { ...existing, canceledAt: undefined, pendingPlanId: planId === existing.planId ? undefined : planId }
        : { ...existing, planId, canceledAt: undefined, pendingPlanId: undefined };
    return { ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? next : m)) };
  });
}

export function cancelMembership(artistId: string) {
  update((s) => ({ ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? { ...m, canceledAt: new Date().toISOString() } : m)) }));
}

export function resumeMembership(artistId: string) {
  update((s) => ({ ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? { ...m, canceledAt: undefined } : m)) }));
}

export function sendMessage(projectSlug: string, body: string, subject?: string) {
  const at = new Date().toISOString();
  update((s) => {
    const existing = s.threads.find((t) => t.projectSlug === projectSlug && (!subject || t.subject === subject));
    if (existing) {
      return { ...s, threads: s.threads.map((t) => (t.id === existing.id ? { ...t, messages: [...t.messages, { from: "me", body, at }] } : t)) };
    }
    const thread: Thread = { id: newId(), projectSlug, subject: subject || "プロジェクトについて", unread: false, messages: [{ from: "me", body, at }] };
    return { ...s, threads: [thread, ...s.threads] };
  });
}

export function markThreadRead(id: string) {
  update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === id ? { ...t, unread: false } : t)) }));
}

export function updateSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function submitProject(s: Omit<Submission, "id" | "submittedAt">) {
  update((st) => ({ ...st, submissions: [{ ...s, id: newId(), submittedAt: jstDateKey() }, ...st.submissions] }));
}

/* ───── 実行者・運営とのつながり（デモではすべて同じブラウザに保存する） ───── */

/** 実行者がメッセージに返信する。支援者のマイページに未読として届く */
export function replyAsArtist(threadId: string, body: string) {
  const at = new Date().toISOString();
  update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === threadId ? { ...t, unread: true, messages: [...t.messages, { from: "artist", body, at }] } : t)) }));
}

/** 実行者が活動報告を投稿する */
export function postUpdate(u: Omit<PostedUpdate, "id" | "publishedAt">) {
  update((s) => ({ ...s, postedUpdates: [{ ...u, id: newId(), publishedAt: new Date().toISOString() }, ...s.postedUpdates] }));
}

/** 実行者がリターンを発送済みにする（取り消しもできる）。追跡番号も一緒に残し、支援者のマイページに出す */
export function setShipped(id: string, shipped: boolean, trackingNo?: string) {
  update((s) => {
    const next = { ...s.shipped };
    const tracking = { ...s.tracking };
    if (shipped) {
      next[id] = new Date().toISOString();
      if (trackingNo?.trim()) tracking[id] = trackingNo.trim().slice(0, 40);
    } else delete next[id];
    return { ...s, shipped: next, tracking };
  });
}

/** 実行者が見本の支援者に返信する（デモ：見本のスレッドへの返信も保存して、件数を合わせる） */
export function replyToSample(threadId: string, body: string) {
  const at = new Date().toISOString();
  update((s) => ({ ...s, sampleReplies: { ...s.sampleReplies, [threadId]: [...(s.sampleReplies[threadId] ?? []), { from: "artist", body, at }] } }));
}

/** 運営からの返信・結果を読んだことにする（ヘッダーの未読の数を減らす） */
export function markOperatorSeen(counts: Record<string, number>) {
  update((s) => ({ ...s, seenOperator: { ...s.seenOperator, ...counts } }));
}

/** 支援者が運営に連絡する（お問い合わせ・通報・返金の相談） */
export function addInquiry(i: Omit<Inquiry, "id" | "receivedAt">): string {
  const id = `my-${newId()}`;
  update((s) => ({ ...s, inquiries: [{ ...i, id, receivedAt: new Date().toISOString() }, ...s.inquiries] }));
  return id;
}

/** 退会・デモのリセット。保存内容をすべて消して最初の状態に戻す */
export function resetDemo() {
  write({ ...INITIAL_STATE });
}
