/**
 * 手数料（仮）。税別・決済手数料込み。正式な料率は事業計画で決める。
 * 実行者への表示と計算はすべてここを参照する。
 */
export const PLATFORM_FEE_RATE = 0.16;

/** 募集の終了から振込までの日数（目安） */
export const PAYOUT_DAYS = 14;

/** 手数料にかかる消費税 */
export const FEE_TAX_RATE = 0.1;

/** 画面に出す手数料の書き方（例：16%＋税） */
export const FEE_LABEL = `${Math.round(PLATFORM_FEE_RATE * 100)}%＋税`;

/** 差し引く手数料（消費税込み）。端数は実行者に有利になるよう切り捨てる */
export function feeAmount(raised: number): number {
  return Math.floor(raised * PLATFORM_FEE_RATE * (1 + FEE_TAX_RATE));
}

export function payoutAmount(raised: number): number {
  return raised - feeAmount(raised);
}

/** 経費をまかなうのに必要な、手数料（消費税込み）を見込んだ目標金額 */
export function grossFor(net: number): number {
  return net / (1 - PLATFORM_FEE_RATE * (1 + FEE_TAX_RATE));
}

/**
 * 手数料の使い道として打ち出すメッセージ。支援がフェスという「みんなの場」に返ってくる。
 * 充てる割合は未定なので、数字は出さない。
 */
export const FES_FUND_MESSAGE = "Oto Fundの手数料の一部は、ONE NOTE FES の開催費用にあてられます。";
