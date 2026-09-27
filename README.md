# OTOFUND（仮）— 音楽特化クラウドファンディング

CAMPFIRE / Makuake / muevo を参考にした、音楽特化のクラウドファンディングサイトのひな形です。
いまはモックデータで動いています。

**デモ：https://yukis01060106.github.io/music-crowdfunding/**

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 本番ビルド（どのページが静的生成か一覧が出る）
npm run deploy:pages  # デモを GitHub Pages に公開（gh-pages ブランチを上書き）
```

GitHub Pages のデモは、`GITHUB_PAGES=1` で完全な静的サイトとして書き出したものです（`next.config.ts`）。
静的ファイルしか置けないため、ログイン・決済などの機能を入れたら Vercel などに移します。

## 技術構成と方針

| 項目 | 採用 | 理由 |
|---|---|---|
| フレームワーク | Next.js 16（App Router）+ TypeScript | 16.1 系には重大な脆弱性があるため 16 系の最新パッチ版を使う |
| ビルド | Turbopack（Next.js 標準） | Next.js は Vite ではビルドできない |
| レンダリング | ハイブリッド | 公開ページは SSG + ISR、支援・マイページ・管理画面は動的 |
| スタイル | Tailwind CSS v4 | |
| 認証・DB（予定） | Supabase | |
| 決済（予定） | Stripe / Stripe Connect | |

`output: 'export'`（完全な静的書き出し）にしないのは、ログイン・決済・支援額の更新・
ビルド後に公開されたプロジェクトのページ生成が、静的書き出しでは使えないためです。

## 画面構成

```
公開（SSG）  /  /projects  /types/[type]  /genres/[genre]  /artists/[id]  /start  /help  /legal/[slug]
            /projects/[slug]           ストーリー（試聴プレイヤー付き）
            /projects/[slug]/updates   活動報告（支援者限定の投稿あり）
            /projects/[slug]/comments  応援コメント
支援者       /login
            /projects/[slug]/support   リターン → お届け先 → お支払い → 確認 → 完了
            /mypage（支援したプロジェクト / favorites / messages / settings）
実行者       /creator（ダッシュボード / projects/new / backers / messages / updates / shipping / payout）
運営         /admin（審査キュー）
```

プロジェクト詳細のタブ3つは `src/app/projects/[slug]/(detail)/` でレイアウト（サイドバー）を共有しています。
支援フローはその外に置き、サイドバーを出さないようにしています。

## ディレクトリ

```
src/
  types/index.ts        ドメイン型（Project, Reward, FundingModel, GoalType など）
  lib/data/index.ts     データ取得の窓口。画面はここだけを使う
  lib/data/mock.ts      モックデータ（Supabase 移行時に削除）
  lib/format.ts         金額・日付・達成率の表示
  components/           共通 UI（ヘッダー、プロジェクトカード、試聴プレイヤーなど）
  app/                  各画面
```

## 音楽特化の機能

- 2軸で探せる：アーティストタイプ（メジャー / インディーズ / YouTuber / TikToker / アイドル / 地下アイドル / 大学生 / 高校生、複数可）× 音楽ジャンル
- 高校生など未成年のプロジェクトは保護者の同意が必須
- 試聴プレイヤー（`Track.previewUrl`）
- リターン種別：0円応援 / デジタル音源 / CD・グッズ / ライブチケット / 体験 / クレジット掲載
- 目標の種類：金額 または 参加人数（0円プランの参加者も数える）
- 達成方式：All-or-Nothing / All-in
- 支援者限定の活動報告（デモ音源の先行公開など）

## 次にやること

1. **Supabase を入れる**：`lib/data/index.ts` の中身を Supabase のクエリに差し替える
2. **認証**：Supabase Auth。`proxy.ts` で `/mypage` `/creator` `/admin` を保護する
3. **決済**：Stripe
   - All-in は PaymentIntent でその場で決済
   - All-or-Nothing は SetupIntent でカードを保存し、目標達成後に請求する（与信の仮押さえは約7日で切れるため）
   - 実行者への送金は Stripe Connect（Express）
4. **更新の反映**：活動報告の投稿や支援のあとに `revalidatePath` で公開ページを再生成する
5. **法務**：利用規約・プライバシーポリシー・特定商取引法の表記を専門家に確認してもらう
