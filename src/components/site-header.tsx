import Link from "next/link";

const NAV = [
  { href: "/projects", label: "プロジェクトをさがす" },
  { href: "/membership", label: "メンバーシップ" },
  { href: "/start", label: "プロジェクトをはじめる" },
  { href: "/help", label: "はじめての方へ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
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
        <nav className="hidden gap-6 text-sm font-medium tracking-wider md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href="/projects"
            aria-label="プロジェクトを検索"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <Link href="/mypage" className="hidden rounded-full px-3 py-2 font-medium hover:bg-stone-100 sm:block">
            マイページ
          </Link>
          <Link href="/login" className="rounded-full bg-ink px-5 py-2.5 font-bold tracking-wider text-white hover:bg-brand">
            ログイン
          </Link>
          <details className="relative md:hidden">
            <summary
              className="flex h-11 w-11 list-none items-center justify-center rounded-full bg-ink text-white"
              aria-label="メニュー"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav className="absolute right-0 top-13 w-60 space-y-1 bg-ink p-3 text-white shadow-xl">
              {[...NAV, { href: "/mypage", label: "マイページ" }, { href: "/creator", label: "実行者管理画面" }].map((n) => (
                <Link key={n.href} href={n.href} className="block px-3 py-2.5 tracking-wider hover:bg-white/10">
                  {n.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
