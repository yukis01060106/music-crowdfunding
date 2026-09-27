"use client";

import { useSyncExternalStore } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

// 静的生成したページでも古くならないよう、残り日数はブラウザで計算する
function subscribe() {
  return () => {};
}

export function DaysLeft({ endAt }: { endAt: string }) {
  const now = useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => null,
  );
  if (now === null) return <span>—</span>;

  const diff = new Date(endAt).getTime() - now;
  if (diff <= 0) return <span>終了</span>;
  if (diff < DAY_MS) return <span>{Math.ceil(diff / (60 * 60 * 1000))}時間</span>;
  return <span>{Math.ceil(diff / DAY_MS)}日</span>;
}
