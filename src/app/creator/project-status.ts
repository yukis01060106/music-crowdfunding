import type { ProjectStatus } from "@/types";

export const STATUS_LABELS: Record<ProjectStatus, { label: string; className: string }> = {
  draft: { label: "作成中", className: "bg-stone-100 text-stone-600" },
  in_review: { label: "審査中", className: "bg-amber-100 text-amber-700" },
  approved: { label: "公開待ち", className: "bg-sky-100 text-sky-700" },
  live: { label: "募集中", className: "bg-emerald-100 text-emerald-700" },
  succeeded: { label: "達成", className: "bg-brand-soft text-brand" },
  failed: { label: "未達成", className: "bg-rose-100 text-rose-700" },
};
