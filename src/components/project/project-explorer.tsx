"use client";

import { useMemo, useState } from "react";
import type { Artist, Project } from "@/types";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { progressPercent } from "@/lib/format";
import { ProjectGrid } from "./project-grid";

const SORTS = {
  popular: { label: "人気順", compare: (a: Project, b: Project) => b.backers - a.backers },
  new: { label: "新着順", compare: (a: Project, b: Project) => b.startAt.localeCompare(a.startAt) },
  ending: { label: "終了が近い順", compare: (a: Project, b: Project) => a.endAt.localeCompare(b.endAt) },
  progress: { label: "達成率順", compare: (a: Project, b: Project) => progressPercent(b) - progressPercent(a) },
} as const;
type SortKey = keyof typeof SORTS;

/** キーワード検索と並び替え。静的サイトでも動くようにブラウザ側で絞り込む */
export function ProjectExplorer({ projects, artists }: { projects: Project[]; artists: Artist[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (p: Project) => {
      if (!q) return true;
      const artist = artists.find((a) => a.id === p.artistId);
      const haystack = [
        p.title,
        p.catchcopy,
        GENRE_LABELS[p.genre],
        artist?.name ?? "",
        ...(artist?.types.map((t) => ARTIST_TYPE_LABELS[t]) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    };
    return projects.filter(matches).sort(SORTS[sort].compare);
  }, [projects, artists, query, sort]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">キーワードで検索</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="アーティスト名・キーワードで検索"
            className="w-full rounded-full border border-stone-300 bg-white px-5 py-2.5"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-stone-500">並び替え</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-stone-300 bg-white px-4 py-2.5"
          >
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORTS[k].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-4 text-sm text-stone-500" aria-live="polite">
        {results.length}件のプロジェクト
      </p>
      <ProjectGrid projects={results} artists={artists} />
    </>
  );
}
