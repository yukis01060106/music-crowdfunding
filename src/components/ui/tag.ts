/**
 * 小さなタグ・バッジ（種類・状態の表示）。角なし。押せるものには使わない（押せるものは chipClass）。
 * - neutral：種類（アーティストのタイプ、リターンの種類など）
 * - brand：運営の確認・おすすめ（本人確認済みなど）
 * - success：完了・達成（成功の色はサイト全体で emerald にそろえる）
 * - warning：注意・未入力
 * - danger：それがあると先へ進めないもの（本人確認の未完了など）
 */
export const TAG_BASE = "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 text-xs font-bold tracking-wider";

const TONES = {
  neutral: "bg-stone-100 text-stone-700",
  brand: "bg-brand-soft text-brand-dark",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-rose-100 text-rose-800",
} as const;

export function tagClass(tone: keyof typeof TONES = "neutral", extra = ""): string {
  return `${TAG_BASE} ${TONES[tone]} ${extra}`;
}
