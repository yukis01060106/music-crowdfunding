import Link from "next/link";
import { LEGAL_DOCS } from "@/lib/legal";

const COLUMNS = [
  {
    title: "支援する方へ",
    links: [
      { href: "/help", label: "はじめての方へ" },
      { href: "/projects", label: "プロジェクトをさがす" },
      { href: "/mypage", label: "マイページ" },
    ],
  },
  {
    title: "アーティストの方へ",
    links: [
      { href: "/start", label: "プロジェクトをはじめる" },
      { href: "/creator", label: "実行者管理画面" },
    ],
  },
  {
    title: "OTOFUNDについて",
    links: LEGAL_DOCS.map((d) => ({ href: `/legal/${d.slug}`, label: d.title })),
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <p className="font-bold text-brand">OTOFUND（仮）</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">音楽のためのクラウドファンディング</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-bold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-stone-900">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">© OTOFUND（仮）</p>
    </footer>
  );
}
