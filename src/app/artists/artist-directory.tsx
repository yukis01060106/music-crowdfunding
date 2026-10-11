"use client";

import Link from "next/link";
import { useState } from "react";
import type { Artist, ArtistType } from "@/types";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { formatYen } from "@/lib/format";
import { lowestPlanPrice } from "@/lib/membership";
import { VerifiedBadge } from "@/components/project/verified-badge";
import { Photo } from "@/components/ui/photo";
import { chipClass } from "@/components/ui/chip";
import { searchInputClass } from "@/components/ui/input";

/** アーティストをタイプで絞り込み、名前で検索する */
export function ArtistDirectory({ artists, projectCounts }: { artists: Artist[]; projectCounts: Record<string, number> }) {
  const [type, setType] = useState<ArtistType | "all">("all");
  const [onlyMembership, setOnlyMembership] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const shown = artists.filter(
    (a) =>
      (type === "all" || a.types.includes(type)) &&
      (!onlyMembership || a.membership) &&
      (!q || `${a.name} ${a.bio} ${a.genres.map((g) => GENRE_LABELS[g]).join(" ")}`.toLowerCase().includes(q)),
  );
  const usedTypes = (Object.keys(ARTIST_TYPE_LABELS) as ArtistType[]).filter((t) => artists.some((a) => a.types.includes(t)));

  return (
    <>
      <div className="mt-8 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="アーティスト名・ジャンルで検索"
          aria-label="アーティストを検索"
          className={searchInputClass}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setType("all")} aria-pressed={type === "all"} className={chipClass(type === "all")}>
            すべて
          </button>
          {usedTypes.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t} className={chipClass(type === t)}>
              {ARTIST_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMembership} onChange={(e) => setOnlyMembership(e.target.checked)} className="accent-brand" />
          メンバー募集中のアーティストだけ
        </label>
      </div>

      <p className="mb-6 mt-6 text-sm text-stone-500" aria-live="polite">
        {shown.length}組のアーティスト
      </p>
      {shown.length === 0 ? (
        <p className="border-2 border-dashed border-stone-300 py-16 text-center text-stone-500">条件に合うアーティストはいません。</p>
      ) : (
        <ul key={`${type}-${onlyMembership}-${q}`} data-stagger className="grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
          {shown.map((a) => (
            <li key={a.id}>
              <Link href={`/artists/${a.id}`} className="group block h-full border-[3px] border-ink/10 bg-white p-3 transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink hover:shadow-sticker">
                <span className="relative block aspect-square overflow-hidden">
                  <Photo src={a.photo} alt={a.name} sizes="(min-width: 1024px) 260px, 45vw" className="transition-transform duration-500 group-hover:scale-105" />
                  {a.membership && (
                    <span className="absolute bottom-0 left-0 bg-pop-yellow px-2 py-0.5 font-en text-[11px] font-black">
                      {formatYen(lowestPlanPrice(a.membership))}〜/月
                    </span>
                  )}
                </span>
                <span className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="line-clamp-2 font-bold tracking-wider group-hover:text-brand">{a.name}</span>
                  <VerifiedBadge verified={a.verified} />
                </span>
                <span className="mt-1 block truncate text-[11px] text-stone-500">{a.types.map((t) => ARTIST_TYPE_LABELS[t]).join(" / ")}</span>
                <span className="mt-2 block text-xs text-stone-600">
                  プロジェクト {projectCounts[a.id] ?? 0}件{a.membership && "・メンバー募集中"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
