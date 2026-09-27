"use client";

import { useNow } from "@/lib/use-now";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function DaysLeft({ endAt }: { endAt: string }) {
  const now = useNow();
  if (now === null) return <span>—</span>;

  const diff = new Date(endAt).getTime() - now;
  if (diff <= 0) return <span>終了</span>;
  if (diff < DAY_MS) return <span>{Math.ceil(diff / HOUR_MS)}時間</span>;
  return <span>{Math.ceil(diff / DAY_MS)}日</span>;
}
