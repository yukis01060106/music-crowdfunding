import Link from "next/link";
import { ARTIST_TYPE_LABELS, GENRE_LABELS, type ArtistType, type Genre } from "@/types";
import { chipClass } from "@/components/ui/chip";

type Current = { kind: "type"; value: ArtistType } | { kind: "genre"; value: Genre } | undefined;

/** 「アーティストタイプ」と「音楽ジャンル」の2軸で探すナビ */
export function BrowseNav({ current }: { current?: Current }) {
  return (
    <div className="my-6 space-y-3">
      <Row label="タイプ">
        <Link href="/projects" aria-current={!current ? "page" : undefined} className={chipClass(!current)}>
          すべて
        </Link>
        {(Object.keys(ARTIST_TYPE_LABELS) as ArtistType[]).map((t) => (
          <Link
            key={t}
            href={`/types/${t}`}
            aria-current={current?.kind === "type" && current.value === t ? "page" : undefined}
            className={chipClass(current?.kind === "type" && current.value === t)}
          >
            {ARTIST_TYPE_LABELS[t]}
          </Link>
        ))}
      </Row>
      <Row label="ジャンル">
        {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
          <Link
            key={g}
            href={`/genres/${g}`}
            aria-current={current?.kind === "genre" && current.value === g ? "page" : undefined}
            className={chipClass(current?.kind === "genre" && current.value === g)}
          >
            {GENRE_LABELS[g]}
          </Link>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline">
      <p className="w-16 shrink-0 text-xs font-bold text-stone-500">{label}</p>
      {/* スマホでは1行の横スクロールにして、最初の画面にプロジェクトが見えるようにする */}
      <div className="relative min-w-0">
        <nav aria-label={`${label}で探す`} className="-mx-4 flex scroll-px-10 gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-0 [&>*]:shrink-0">
          {children}
        </nav>
        <span className="pointer-events-none absolute inset-y-0 -right-4 w-10 bg-gradient-to-l from-white to-transparent sm:hidden" aria-hidden />
      </div>
    </div>
  );
}
