/**
 * 手数料（仮）。決済手数料込み。正式な料率は事業計画で決める。
 * 実行者への表示と計算はすべてここを参照する。
 */
export const PLATFORM_FEE_RATE = 0.1;

export function payoutAmount(raised: number): number {
  return Math.floor(raised * (1 - PLATFORM_FEE_RATE));
}

/**
 * 手数料の使い道として打ち出すメッセージ。支援がフェスという「みんなの場」に返ってくる。
 * 充てる割合は未定なので、数字は出さない。
 */
export const FES_FUND_MESSAGE = "OTOFUNDの手数料の一部は、ONE NOTE FES の開催費用にあてられます。";
