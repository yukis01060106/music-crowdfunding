"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/button";
import { useDemo, useHydrated } from "@/lib/demo-store";

/** 名前の頭文字のアイコン */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-pop-pink font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** ヘッダー右上。ログイン中はアイコンとマイページ、未ログインならログインボタン */
export function AccountButton() {
  const { user, threads } = useDemo();
  const pathname = usePathname();
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => "",
  );
  const hydrated = useHydrated();
  const unread = threads.filter((t) => t.unread).length;

  // 描画前はボタンの幅だけ確保して、ちらつきを防ぐ
  if (!hydrated) return <span className="inline-block h-11 w-24" aria-hidden />;

  if (!user) {
    return (
      <Link href={pathname === "/login" ? "/login" : `/login?next=${encodeURIComponent(pathname + search)}`} className={buttonClass("dark", "md", "whitespace-nowrap px-3 sm:px-5")}>
        ログイン
      </Link>
    );
  }
  return (
    <Link href="/mypage" className="relative flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-stone-100" aria-label={`マイページ（${user.name}さん）${unread ? `・未読メッセージ${unread}件` : ""}`}>
      <Avatar name={user.name} />
      <span className="hidden max-w-[8rem] truncate text-sm font-bold sm:block">{user.name}</span>
      {unread > 0 && <span className="absolute left-7 top-0 h-3 w-3 rounded-full border-2 border-white bg-pop-pink" aria-hidden />}
    </Link>
  );
}
