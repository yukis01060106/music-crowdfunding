"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1600;

/** 画面に入ったら 0 から数字を数え上げる。format で表示形式（円・人など）を変える */
export function CountUp({ value, format = "number", prefix = "" }: { value: number; format?: "number" | "yen"; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // サーバー描画では最終値を出し、ブラウザで 0 から数え直す
    setShown(0);
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 4))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  const text = new Intl.NumberFormat("ja-JP").format(shown);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {format === "yen" ? `¥${text}` : text}
    </span>
  );
}
