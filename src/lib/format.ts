import type { Project } from "@/types";

const yen = new Intl.NumberFormat("ja-JP");

export function formatYen(amount: number): string {
  return `¥${yen.format(amount)}`;
}

/** 価格の表示。0円のプランは「¥0」ではなく「0円」と書く */
export function formatPrice(amount: number): string {
  return amount === 0 ? "0円" : formatYen(amount);
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

/** 日本時間の日付（YYYY-MM-DD）。ファイル名やグラフの日付に使う（toISOString は UTC で1日ずれる） */
export function jstDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** 日時（メッセージなど）。どこから見ても日本時間で表示する */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 年つきの日時（操作の記録など、年をまたいで見比べるもの） */
export function formatDateTimeFull(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** CSV 用の日時（日本時間の ISO 形式。表計算で並べ替えられるように） */
export function isoJst(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }).replace(" ", "T")}+09:00`;
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
