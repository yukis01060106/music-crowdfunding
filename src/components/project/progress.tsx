import type { Project } from "@/types";
import { progressPercent } from "@/lib/format";

export function ProgressBar({ project }: { project: Project }) {
  const percent = progressPercent(project);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200" aria-label={`達成率 ${percent}%`}>
      <div
        className={`h-full rounded-full ${percent >= 100 ? "bg-emerald-500" : "bg-brand"}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
