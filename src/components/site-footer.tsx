import Link from "next/link";
import { FES_FUND_MESSAGE } from "@/lib/fees";
import { LEGAL_DOCS } from "@/lib/legal";

const COLUMNS = [
  {
    title: "支援する方へ",
    links: [
      { href: "/help", label: "はじめての方へ" },
      { href: "/projects", label: "プロジェクトをさがす" },
      { href: "/artists", label: "アーティスト" },
      { href: "/membership", label: "メンバーシップ" },
      { href: "/fes", label: "ONE NOTE FES" },
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
    links: [...LEGAL_DOCS.map((d) => ({ href: `/legal/${d.slug}`, label: d.title })), { href: "/contact", label: "お問い合わせ" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <p className="font-en text-3xl font-black tracking-tight">OTOFUND</p>
          <p className="mt-2 text-xs leading-relaxed tracking-wider text-white/60">音楽のためのクラウドファンディング（仮称）</p>
          <p className="mt-4 text-xs leading-relaxed tracking-wider text-white/60">{FES_FUND_MESSAGE}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-bold tracking-wider">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-white/10 py-4 text-center font-en text-xs text-white/40">© OTOFUND</p>
    </footer>
  );
}
