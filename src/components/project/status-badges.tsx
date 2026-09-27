"use client";

import type { Project } from "@/types";
import { progressPercent } from "@/lib/format";
import { useNow } from "@/lib/use-now";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 「公開直後」と「終了間近」は支援が最も集まる時期なので、カードで目立たせる。
 * 時刻に依存するのでブラウザで判定する。
 */
export function StatusBadges({ project }: { project: Project }) {
  const now = useNow();
  const badges: { label: string; className: string }[] = [];

  if (progressPercent(project) >= 100) {
    badges.push({ label: "目標達成", className: "bg-emerald-500 text-white" });
  }
  if (now !== null) {
    const left = new Date(project.endAt).getTime() - now;
    const since = now - new Date(project.startAt).getTime();
    if (left > 0 && left <= 3 * DAY_MS) badges.push({ label: "まもなく終了", className: "bg-rose-500 text-white" });
    else if (since >= 0 && since <= 7 * DAY_MS) badges.push({ label: "NEW", className: "bg-sky-500 text-white" });
  }

  if (badges.length === 0) return null;
  return (
    <span className="flex gap-1">
      {badges.map((b) => (
        <span key={b.label} className={`rounded-full px-2 py-0.5 text-xs font-bold ${b.className}`}>
          {b.label}
        </span>
      ))}
    </span>
  );
}
