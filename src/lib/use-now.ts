"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

// 1分単位に丸めて、同じ分の間は同じ値を返す（useSyncExternalStore の要件）
const getSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const getServerSnapshot = () => null;

/**
 * 現在時刻（ミリ秒）。静的生成したページでも古くならないよう、ブラウザで計算する。
 * サーバー描画時は null。
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
