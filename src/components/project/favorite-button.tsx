"use client";

import { toggleFavorite, useDemo } from "@/lib/demo-store";
import { toast } from "@/components/ui/toast";

// TODO: 認証を入れたら、お気に入りをサーバーに保存する
export function FavoriteButton({ slug }: { slug: string }) {
  const { favorites } = useDemo();
  const on = favorites.includes(slug);
  return (
    <button
      type="button"
      onClick={() => {
        toggleFavorite(slug);
        toast(on ? "お気に入りから外しました" : "お気に入りに追加しました");
      }}
      aria-pressed={on}
      className={`group w-full rounded-lg border py-2 text-sm font-medium transition ${
        on ? "border-rose-300 bg-rose-50 text-rose-600" : "border-stone-300 text-stone-700 hover:bg-stone-50"
      }`}
    >
      <span className={`inline-block transition-transform ${on ? "scale-125" : "group-active:scale-90"}`} aria-hidden>
        {on ? "♥" : "♡"}
      </span>{" "}
      {on ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}
