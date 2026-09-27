import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand">
          OTOFUND<span className="text-xs text-stone-400">（仮）</span>
        </Link>
        <nav className="hidden gap-5 text-sm text-stone-600 sm:flex">
          <Link href="/projects" className="hover:text-stone-900">
            プロジェクトをさがす
          </Link>
          <Link href="/start" className="hover:text-stone-900">
            プロジェクトをはじめる
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/mypage" className="text-stone-600 hover:text-stone-900">
            マイページ
          </Link>
          <Link href="/creator" className="text-stone-600 hover:text-stone-900">
            管理画面
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
          >
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
}
