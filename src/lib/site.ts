/**
 * 公開サイトの URL（末尾スラッシュなし）。シェア画像やサイトマップの絶対 URL に使う。
 * - GitHub Pages のデモ：github.io のサブパス
 * - 開発中：localhost
 * - 本番：環境変数 NEXT_PUBLIC_SITE_URL が必須。入れ忘れてデモのドメインを指さないよう、未設定ならビルドを止める
 */
function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  if (basePath) return `https://yukis01060106.github.io${basePath}`;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_SITE_URL が未設定です。本番の URL（例：https://otofund.example）を環境変数に入れてください。");
}

export const SITE_URL = resolveSiteUrl();

/** サービス名。ロゴは英字の「Oto Fund」、読みは「オトファンド」 */
export const SITE_NAME = "Oto Fund（オトファンド）";
export const SITE_DESCRIPTION = "アーティストとファンが一緒に音楽をつくる、音楽特化のクラウドファンディング。アルバム・ライブ・MVを、ファンの支援で。";

/**
 * デモ版か。決済（Stripe）とデータベース（Supabase）をつないだら、環境変数 NEXT_PUBLIC_DEMO=0 にして帯を消す。
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO !== "0";

/**
 * どのページにも付ける OGP。子のページで openGraph を書くと丸ごと上書きされるので、展開して使う。
 */
export const baseOpenGraph = { siteName: SITE_NAME, locale: "ja_JP", type: "website" } as const;

/** シェア画像の大きさ（summary_large_image の推奨） */
export const OG_SIZE = { width: 1200, height: 630 };
