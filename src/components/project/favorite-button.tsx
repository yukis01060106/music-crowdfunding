"use client";

import { buttonClass } from "@/components/ui/button";
import { Heart, ICON } from "@/components/ui/icon";
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
      {/* オンにした瞬間だけ、ハートが弾む（動きを減らす設定では弾まない） */}
      <Heart {...ICON} key={on ? "on" : "off"} className={`size-5 ${on ? "fill-current text-pop-pink motion-safe:animate-[pop_0.4s_cubic-bezier(0.22,1,0.36,1)]" : "group-active:scale-90"}`} />
      {on ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}
