import type { Project } from "@/types";
import { progressPercent } from "@/lib/format";

const HEIGHT = { sm: "h-2", md: "h-2.5", lg: "h-3" } as const;

/**
 * 達成の進み具合。クラウドファンディングでいちばん大事な図なので、太めに描く。
 * 表示されたときに左から伸びる（動きを減らす設定では伸びない）
 */
export function ProgressBar({ project, size = "sm" }: { project: Project; size?: keyof typeof HEIGHT }) {
  const percent = progressPercent(project);
  return (
    <div className={`${HEIGHT[size]} w-full overflow-hidden bg-stone-200`} aria-hidden>
      <div
        className="h-full origin-left bg-brand motion-safe:animate-[grow_1.1s_cubic-bezier(0.22,1,0.36,1)_both]"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
