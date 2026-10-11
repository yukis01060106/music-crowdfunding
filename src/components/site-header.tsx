import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { AccountButton } from "./account-button";
import { HeaderNav } from "./header-nav";
import { ICON, Search } from "./ui/icon";

const NAV = [
  { href: "/projects", label: "プロジェクトをさがす", en: "Projects" },
  { href: "/artists", label: "アーティスト", en: "Artists" },
  { href: "/membership", label: "メンバーシップ", en: "Membership" },
  { href: "/start", label: "プロジェクトをはじめる", en: "For artists" },
  { href: "/help", label: "はじめての方へ", en: "Guide" },
];

export function SiteHeader() {
  return (
    <header className="header-scroll sticky top-0 z-40 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-8">
        <Link href="/" className="flex items-center gap-1.5" aria-label="Oto Fund（オトファンド） トップへ">
          <span className="whitespace-nowrap font-en text-2xl font-black tracking-tight text-ink">Oto Fund</span>
          <span
            className="text-[7px] font-bold leading-none tracking-wider text-stone-500"
            style={{ writingMode: "vertical-rl" }}
          >
            オトファンド
          </span>
        </Link>
        <HeaderNav items={NAV} />
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href="/projects?focus=1"
            aria-label="プロジェクトを検索"
            className="flex h-11 w-11 items-center justify-center hover:bg-stone-100"
          >
            <Search {...ICON} className="size-5" />
          </Link>
          <AccountButton />
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
