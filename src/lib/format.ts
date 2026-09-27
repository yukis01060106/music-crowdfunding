import type { Project } from "@/types";

const yen = new Intl.NumberFormat("ja-JP");

export function formatYen(amount: number): string {
  return `¥${yen.format(amount)}`;
}

export function formatNumber(n: number): string {
  return yen.format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDuration(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** 目標の種類に応じた達成率（%）。参加人数目標なら支援者数で計算する */
export function progressPercent(p: Project): number {
  const current = p.goalType === "participants" ? p.backers : p.raised;
  return Math.floor((current / p.goal) * 100);
}

export function formatGoal(p: Project): string {
  return p.goalType === "participants" ? `${formatNumber(p.goal)}人` : formatYen(p.goal);
}
