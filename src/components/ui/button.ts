/**
 * ボタンの見た目。サイト全体で角は付けない（ステッカー調）。検索欄と絞り込みのチップだけは丸にする。
 * - primary：支援・申込みなど、その画面でいちばんしてほしい行動（brand の紫）
 * - dark：2番目に大事な行動
 * - secondary：枠だけの控えめなボタン
 * - onDark：黒・紫の背景の上に置く CTA（黄色）
 * - danger：取り消しにくい操作の確定（返金・停止・差し戻しなど）
 * 大きさは size で選ぶ。タップしやすいよう、どれも高さ 44px 以上になる。
 */
// 押したときに少し沈む（動きを減らす設定では globals.css で止まる）
const BASE = "inline-flex min-h-11 items-center justify-center gap-1.5 text-center font-bold tracking-wider transition active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-white disabled:active:scale-100";

const VARIANTS = {
  primary: "bg-brand text-white hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_4px_0_0_var(--color-ink)] disabled:hover:translate-y-0 disabled:hover:shadow-none",
  dark: "bg-ink text-white hover:bg-brand",
  secondary: "border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white",
  onDark: "bg-pop-yellow text-ink hover:bg-white",
  danger: "bg-rose-700 text-white hover:bg-rose-800",
} as const;

const SIZES = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5",
} as const;

export function buttonClass(variant: keyof typeof VARIANTS = "primary", size: keyof typeof SIZES = "md", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}
