"use client";

import type { Project } from "@/types";
import { progressPercent } from "@/lib/format";
import { useNow } from "@/lib/use-now";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 「公開直後」と「終了間近」は支援が最も集まる時期なので、写真の左上にタブで目立たせる。
 * 時刻に依存するのでブラウザで判定する。
 */
export function StatusBadges({ project, className = "" }: { project: Project; className?: string }) {
  const now = useNow();
  const badges: { label: string; className: string }[] = [];

  if (progressPercent(project) >= 100) {
    badges.push({ label: "目標達成", className: "bg-pop-teal" });
  }
  if (now !== null) {
    const left = new Date(project.endAt).getTime() - now;
    const since = now - new Date(project.startAt).getTime();
    if (left > 0 && left <= 3 * DAY_MS) badges.push({ label: "まもなく終了", className: "bg-rose-500" });
    else if (since >= 0 && since <= 7 * DAY_MS) badges.push({ label: "NEW", className: "bg-ink" });
  }

  if (badges.length === 0) return null;
  return (
    <span className={`flex ${className}`}>
      {badges.map((b) => (
        <span key={b.label} className={`px-2.5 py-1 font-en text-xs font-bold tracking-wider text-white ${b.className}`}>
          {b.label}
        </span>
      ))}
    </span>
  );
}
