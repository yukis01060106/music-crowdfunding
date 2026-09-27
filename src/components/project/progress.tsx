import type { Project } from "@/types";
import { progressPercent } from "@/lib/format";

export function ProgressBar({ project }: { project: Project }) {
  const percent = progressPercent(project);
  return (
    <div className="h-1.5 w-full overflow-hidden bg-stone-200" aria-label={`達成率 ${percent}%`}>
      <div
        className={`h-full ${percent >= 100 ? "bg-pop-teal" : "bg-brand"}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
