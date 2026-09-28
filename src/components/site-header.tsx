import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { AccountButton } from "./account-button";

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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link href="/" className="flex items-center gap-1.5" aria-label="OTOFUND トップへ">
          <span className="font-en text-2xl font-black tracking-tight text-ink">OTOFUND</span>
          <span
            className="font-en text-[7px] font-medium leading-none tracking-wider text-stone-500"
            style={{ writingMode: "vertical-rl" }}
          >
            MUSIC CF
          </span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium tracking-wider lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="group relative py-1 transition hover:text-brand">
              {n.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href="/projects"
            aria-label="プロジェクトを検索"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <AccountButton />
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
