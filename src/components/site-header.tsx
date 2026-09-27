import Link from "next/link";

const NAV = [
  { href: "/projects", label: "プロジェクトをさがす" },
  { href: "/start", label: "プロジェクトをはじめる" },
  { href: "/help", label: "はじめての方へ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand">
          OTOFUND<span className="text-xs text-stone-400">（仮）</span>
        </Link>
        <nav className="hidden gap-5 text-sm text-stone-600 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-stone-900">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href="/projects"
            aria-label="プロジェクトを検索"
            className="rounded-full p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <Link href="/mypage" className="hidden rounded-full px-3 py-2 text-stone-600 hover:bg-stone-100 sm:block">
            マイページ
          </Link>
          <Link href="/login" className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            ログイン
          </Link>
          <details className="relative md:hidden">
            <summary className="list-none rounded-full p-2 text-stone-600 hover:bg-stone-100" aria-label="メニュー">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <nav className="absolute right-0 top-11 w-56 space-y-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
              {[...NAV, { href: "/mypage", label: "マイページ" }, { href: "/creator", label: "実行者管理画面" }].map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 hover:bg-stone-100">
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
