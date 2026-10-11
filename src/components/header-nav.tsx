"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { normPath } from "@/lib/path";

/** PC のヘッダーのナビ。今いるページ（とその下の階層）には下線を出し、読み上げにも伝える */
export function HeaderNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = normPath(usePathname());
  return (
    <nav aria-label="メインメニュー" className="hidden gap-6 text-sm font-medium tracking-wider lg:flex">
      {items.map((n) => {
        const current = pathname === n.href || pathname.startsWith(`${n.href}/`);
        return (
          <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : current ? "true" : undefined} className={`group relative py-1 transition hover:text-brand ${current ? "text-brand" : ""}`}>
            {n.label}
            <span
              className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-brand transition-transform duration-300 group-hover:scale-x-100 ${current ? "scale-x-100" : "scale-x-0"}`}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}
