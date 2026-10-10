"use client";

import { useNow } from "@/lib/use-now";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 最後の活動報告からの日数。静的に書き出したページでも古くならないよう、ブラウザで計算する */
export function UpdateReminder({ lastAt }: { lastAt?: string }) {
  const now = useNow();
  if (!lastAt) return <>まだ活動報告がありません。最初の近況を伝えましょう</>;
  if (now === null) return <>活動報告で近況を伝えましょう</>;
  const days = Math.max(0, Math.floor((now - new Date(lastAt).getTime()) / DAY_MS));
  return <>{days === 0 ? "今日、活動報告を投稿しました" : `最後の活動報告から${days}日たちました。近況を伝えましょう`}</>;
}
