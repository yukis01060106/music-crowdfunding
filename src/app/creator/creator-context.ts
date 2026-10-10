/**
 * デモでログインしている実行者。実行者の画面はすべてこのアーティストとして表示する。
 * TODO（本番）: 認証を入れたら、ログイン中のアーティストに差し替える
 */
export const CREATOR_ARTIST_ID = "hoshizora-radio";
export const CREATOR_PROJECT_SLUG = "hoshizora-1st-album";

/** 住所から都道府県だけを取り出す（一覧には都道府県までしか出さない） */
export function prefectureOf(address: string): string {
  return address.match(/(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)?.[1] ?? "—";
}
