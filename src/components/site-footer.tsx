import Link from "next/link";
import { LEGAL_DOCS } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:justify-between">
        <p>© OTOFUND（仮）</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/help" className="hover:text-stone-900">
            ヘルプ
          </Link>
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc.slug} href={`/legal/${doc.slug}`} className="hover:text-stone-900">
              {doc.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
