import Link from "next/link";
import { ARTIST_TYPE_LABELS, GENRE_LABELS, type ArtistType, type Genre } from "@/types";

type Current = { kind: "type"; value: ArtistType } | { kind: "genre"; value: Genre } | undefined;

const base = "rounded-full border px-3 py-1 text-sm";
const on = "border-brand bg-brand text-white";
const off = "border-stone-300 bg-white hover:border-brand hover:text-brand";

/** 「アーティストタイプ」と「音楽ジャンル」の2軸で探すナビ */
export function BrowseNav({ current }: { current?: Current }) {
  return (
    <div className="my-6 space-y-3">
      <Row label="タイプ">
        <Link href="/projects" className={`${base} ${current ? off : on}`}>
          すべて
        </Link>
        {(Object.keys(ARTIST_TYPE_LABELS) as ArtistType[]).map((t) => (
          <Link
            key={t}
            href={`/types/${t}`}
            className={`${base} ${current?.kind === "type" && current.value === t ? on : off}`}
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
            className={`${base} ${current?.kind === "genre" && current.value === g ? on : off}`}
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
      <nav className="flex flex-wrap gap-2">{children}</nav>
    </div>
  );
}
