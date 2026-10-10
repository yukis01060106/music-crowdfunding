import type { Project } from "@/types";
import { progressPercent } from "@/lib/format";

export function ProgressBar({ project }: { project: Project }) {
  const percent = progressPercent(project);
  return (
    <div className="h-1.5 w-full overflow-hidden bg-stone-200" aria-hidden>
      <div
        className={`h-full ${percent >= 100 ? "bg-emerald-600" : "bg-brand"}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
