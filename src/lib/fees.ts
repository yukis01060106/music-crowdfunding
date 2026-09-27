/**
 * 手数料（仮）。決済手数料込み。正式な料率は事業計画で決める。
 * 実行者への表示と計算はすべてここを参照する。
 */
export const PLATFORM_FEE_RATE = 0.1;

export function payoutAmount(raised: number): number {
  return Math.floor(raised * (1 - PLATFORM_FEE_RATE));
}
