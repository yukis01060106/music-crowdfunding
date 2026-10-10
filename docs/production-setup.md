# 本番の準備（Supabase・Stripe・メール・公開先）

デモ（GitHub Pages）は、記録をブラウザの中に保存しているので、別の人や別の端末とはつながりません。
本番では、次の4つをつなぎます。ここまでに用意したものと、キーを入れたあとの手順をまとめます。

## すでに用意してあるもの

| もの | 場所 | 状態 |
|---|---|---|
| データベースの設計（テーブル・行の権限・操作の記録） | `supabase/migrations/0001_init.sql` | そのまま流せる |
| Stripe の決済（支援・メンバーシップ・後からの請求・プラン変更） | `src/app/api/checkout/**`、`src/app/api/membership/update` | テストモードで動く（`docs/stripe-test.md`） |
| Stripe からの通知の受け口（Webhook） | `src/app/api/stripe/webhook/route.server.ts` | 署名の確認・重複の除外・メールの送信まで。データベースへの記録は TODO |
| 目標達成時の一斉請求 | `scripts/charge-aon.mjs`（`npm run charge:aon -- <slug>`） | テストモードで動く。既定は確かめるだけ |
| メールの送信と文面 | `src/lib/email.ts` | Resend のキーがあれば送る。なければログだけ |
| 運営・実行者・支援者の画面 | `src/app/admin`、`src/app/creator`、`src/app/mypage` | デモの保存先（`demo-store`・`admin-store`）を、データベースに置き換える |

各ファイルの `TODO（本番）` が、データベースにつなぐときに書き換える場所です。

## 1. Supabase（データベース・ログイン・画像）

1. https://supabase.com で新しいプロジェクトを作る（会社のアカウントでよい。サイトごとに分けるのがおすすめ）
2. 「SQL Editor」で `supabase/migrations/0001_init.sql` の中身を実行する
3. 「Authentication」→「Providers」で Email（マジックリンク）を有効にし、必要なら Google・X も設定する
4. 「Storage」で `project-images`（公開）と `identity-documents`（非公開）のバケットを作る
5. 「Project Settings」→「API」の値を `.env.local` に入れる
   - `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用。ブラウザに出さない）
6. 運営のアカウントは、登録したあと SQL で `update profiles set role = 'admin' where id = '…'` とする（画面からは変えられない）

キーを入れてもらえれば、画面をデータベースにつなぐ作業（読み書きの置き換え、ログイン、画像のアップロード）を進めます。

## 2. Stripe（決済）

1. テストモードで `STRIPE_SECRET_KEY=sk_test_…` を入れ、`docs/stripe-test.md` の手順で支援・メンバーシップを試す
2. Webhook を受け取る
   - 手元：`stripe listen --forward-to localhost:3000/api/stripe/webhook`（開発サーバーのポート。既定は 3000） を動かし、表示された `whsec_…` を `STRIPE_WEBHOOK_SECRET` に入れる
   - 本番：「4. 公開先」で公開してから、Stripe のダッシュボードの「Webhook」に `https://<本番のドメイン>/api/stripe/webhook` を登録し、次のイベントを選ぶ（テストモードと本番モードで登録も `whsec_` も別）
     `checkout.session.completed`、`checkout.session.async_payment_succeeded`、`checkout.session.async_payment_failed`、`checkout.session.expired`、
     `payment_intent.succeeded`、`payment_intent.payment_failed`、`charge.refunded`、`invoice.payment_failed`、
     `customer.subscription.updated`、`customer.subscription.deleted`
3. All-or-Nothing の一斉請求：募集が終わり目標を達成したら
   `npm run charge:aon -- <slug>`（確かめる）→ `npm run charge:aon -- <slug> --execute`（請求する）
   本番では、表示された合計を `--expect-total=<円>` で付けたときだけ請求する
4. アーティストへの送金（Stripe Connect）：Stripe の審査のあとに、Express アカウントでの本人確認と振込先の登録を入れる
5. 本番のキーは、Stripe の審査が通り、上の仕組みがそろってから。`STRIPE_ALLOW_LIVE=1` を付けたときだけ動く

## 3. メール（Resend）

1. https://resend.com でアカウントを作り、送信元のドメインを認証する（SPF・DKIM）
2. `RESEND_API_KEY` と `EMAIL_FROM`（例：`Oto Fund <no-reply@otofund.example>`）を入れる
   - 送るメール：支援の受付、コンビニ払いの支払い待ち・入金・期限切れ、目標達成の請求、請求の失敗、返金（文面は `src/lib/email.ts`）
3. ログインのメール（マジックリンク）は Supabase の「Auth」→「SMTP」に Resend を設定すると、同じ送信元から届く

## 4. 公開先（Vercel）

GitHub Pages はサーバーの処理（決済・Webhook・AI校正）が動かないので、本番は Vercel に置きます。

1. https://vercel.com で GitHub のリポジトリを読み込む
2. 「Environment Variables」に `.env.example` の値を入れる。`NEXT_PUBLIC_SITE_URL` はビルドに必須なので、最初は `https://<プロジェクト名>.vercel.app` を入れてデプロイする
3. 独自ドメインを設定したら、`NEXT_PUBLIC_SITE_URL` をそのドメインに置き換えて、もう一度デプロイする。そのあと本番の Webhook を登録する（2-2）
   - Preview（プレビュー）では決済を試さない。決済のあと戻る先が `NEXT_PUBLIC_SITE_URL` になるため（テストのキーだけを入れる）
4. 決済とデータベースをつないだら `NEXT_PUBLIC_DEMO=0` にして、デモの帯を消す

## 公開の前に、あなたに決めてもらうこと

- 特商法・利用規約の〔 〕（会社名・住所・責任者・登録番号）と、弁護士による確認
- 手数料の正式な料率と、ONE NOTE FES にあてる割合
- Stripe の審査の申し込み（クラウドファンディングは事前の審査が必要）
