"use client";

import { useEffect, useState } from "react";

// 画面の下に短く出るお知らせ。どこからでも toast("保存しました") で呼べる

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function toast(message: string) {
  listeners.forEach((l) => l(message));
}

const SHOW_MS = 2600;

/** レイアウトに1つだけ置く */
export function Toaster() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([]);

  useEffect(() => {
    let seq = 0;
    const listener: Listener = (message) => {
      const id = ++seq;
      setItems((prev) => [...prev.slice(-2), { id, message }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), SHOW_MS);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite" role="status">
      {items.map((i) => (
        <p key={i.id} className="animate-rise bg-ink px-5 py-3 text-sm font-bold tracking-wider text-white shadow-xl">
          {i.message}
        </p>
      ))}
    </div>
  );
}
