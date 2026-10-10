/**
 * 絞り込み・カテゴリのチップ。ボタンは角なしだが、チップだけは丸にする（決まり）。
 * 高さ 44px、選択中は brand の紫。暗い背景の上では dark を使う。
 */
export function chipClass(on = false, dark = false): string {
  const base = "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition";
  if (dark) return `${base} ${on ? "border-white bg-white text-ink" : "border-white/60 text-white hover:bg-white hover:text-ink"}`;
  return `${base} ${on ? "border-brand bg-brand text-white" : "border-stone-500 bg-white text-ink hover:border-brand hover:text-brand"}`;
}
