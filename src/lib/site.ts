/**
 * 公開サイトの URL（末尾スラッシュなし）。シェア画像やサイトマップの絶対 URL に使う。
 * 本番のドメインが決まったら、環境変数 NEXT_PUBLIC_SITE_URL で差し替える。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://yukis01060106.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

export const SITE_NAME = "OTOFUND（仮）";
export const SITE_DESCRIPTION = "アーティストとファンが一緒に音楽をつくる、音楽特化のクラウドファンディング。アルバム・ライブ・MVを、ファンの支援で。";
