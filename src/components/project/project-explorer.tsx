"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import type { Artist, Project } from "@/types";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { progressPercent } from "@/lib/format";
import { ProjectGrid } from "./project-grid";
import { searchInputClass } from "@/components/ui/input";

const SORTS = {
  popular: { label: "人気順", compare: (a: Project, b: Project) => b.backers - a.backers },
  new: { label: "新着順", compare: (a: Project, b: Project) => b.startAt.localeCompare(a.startAt) },
  ending: { label: "終了が近い順", compare: (a: Project, b: Project) => a.endAt.localeCompare(b.endAt) },
  // 並べ替えは見本の数字のまま（デモでは、このブラウザの支援で順位を動かさない）
  progress: { label: "達成率順", compare: (a: Project, b: Project) => progressPercent(b) - progressPercent(a) },
} as const;
type SortKey = keyof typeof SORTS;

/** キーワード検索と並び替え。静的サイトでも動くようにブラウザ側で絞り込む */
export function ProjectExplorer({ projects, artists }: { projects: Project[]; artists: Artist[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // 検索のことばは URL（?q=）にも残す（戻る・共有で消えないように）
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const focusParam = searchParams.get("focus");
  // ヘッダーの検索アイコンから来たとき（?focus=1）は、入力欄にフォーカスする
  useEffect(() => {
    if (focusParam === "1") inputRef.current?.focus();
  }, [focusParam]);
  function updateQuery(value: string) {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("focus");
    if (value.trim()) params.set("q", value);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
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
            ref={inputRef}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="アーティスト名・キーワードで検索"
            className={searchInputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-stone-500">並び替え</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-11 border border-stone-500 bg-white px-4 py-2.5"
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
      {results.length === 0 && query.trim() ? (
        <div className="border-2 border-dashed border-stone-300 p-10 text-center">
          <p className="text-stone-600">「{query.trim()}」に当てはまるプロジェクトはありませんでした。</p>
          <button type="button" onClick={() => { updateQuery(""); inputRef.current?.focus(); }} className={buttonClass("secondary", "md", "mt-4")}>
            キーワードを消す
          </button>
        </div>
      ) : (
        <ProjectGrid projects={results} artists={artists} />
      )}
    </>
  );
}
