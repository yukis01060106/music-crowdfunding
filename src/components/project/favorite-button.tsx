"use client";

import { buttonClass } from "@/components/ui/button";
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
      className={buttonClass(on ? "dark" : "secondary", "md", "group w-full")}
    >
      <span className={`inline-block transition-transform ${on ? "scale-125" : "group-active:scale-90"}`} aria-hidden>
        {on ? "♥" : "♡"}
      </span>{" "}
      {on ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}
