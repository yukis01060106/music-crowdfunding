"use client";

import type { Project } from "@/types";
import { liveTotals, useNewBackings } from "@/lib/backing-state";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { ProgressBar } from "./progress";

/**
 * 公開ページ・カードの数字。見本の数字に、このブラウザの有効な支援（返金を除く）を足す。
 * 実行者の画面と同じ数え方なので、支援するとどちらの数字も同じだけ増える。
 * TODO（本番）: 支援のテーブルから集計した数字をサーバーで返す
 */
export function useLiveProject<P extends Project>(project: P): P {
  const now = useNow();
  const added = useNewBackings(project.slug, now).filter((b) => !b.refunded);
  return liveTotals(project, added);
}

export function LiveAmount({ project }: { project: Project }) {
  const p = useLiveProject(project);
  return <>{p.goalType === "participants" ? `${formatNumber(p.backers)}人` : formatYen(p.raised)}</>;
}

export function LivePercent({ project, className = "" }: { project: Project; className?: string }) {
  const percent = progressPercent(useLiveProject(project));
  return <span className={`${className} text-brand`}>{percent}%</span>;
}

export function LiveBackers({ project }: { project: Project }) {
  return <>{formatNumber(useLiveProject(project).backers)}</>;
}

export function LiveProgressBar({ project, size }: { project: Project; size?: "sm" | "md" | "lg" }) {
  return <ProgressBar project={useLiveProject(project)} size={size} />;
}
