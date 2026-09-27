"use client";

import { useState } from "react";

// TODO: 認証を入れたら、お気に入りをサーバーに保存する（未ログインならログインへ誘導）
export function FavoriteButton() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      aria-pressed={on}
      className={`w-full rounded-lg border py-2 text-sm font-medium ${
        on ? "border-rose-300 bg-rose-50 text-rose-600" : "border-stone-300 text-stone-700 hover:bg-stone-50"
      }`}
    >
      {on ? "♥ お気に入り済み" : "♡ お気に入り"}
    </button>
  );
}
