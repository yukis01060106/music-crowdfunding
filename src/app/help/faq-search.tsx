"use client";

import { useState } from "react";
import type { FaqGroup } from "./faq";

/** 質問をキーワードで絞り込む。何も入力していなければ全件をカテゴリ別に出す */
export function FaqSearch({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({ ...g, items: q ? g.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) : g.items }))
    .filter((g) => g.items.length > 0);
  const count = filtered.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <>
      <label className="mt-8 block">
        <span className="sr-only">質問を検索</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワードで検索（例：解約、送料、チケット）"
          className="w-full rounded-full border border-stone-300 bg-white px-5 py-3 focus:border-brand focus:outline-none"
        />
      </label>

      {q ? (
        <p className="mt-3 text-sm text-stone-500" aria-live="polite">
          {count}件の質問が見つかりました
        </p>
      ) : (
        <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="質問のカテゴリ">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="rounded-full border border-stone-300 bg-white px-3 py-1 transition hover:border-brand hover:text-brand">
              {g.title}
            </a>
          ))}
        </nav>
      )}

      {filtered.map((g) => (
        <section key={g.id} id={g.id} className="mt-10 scroll-mt-20">
          <h2 className="mb-3 border-l-4 border-brand pl-3 text-lg font-bold">{g.title}</h2>
          <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
            {g.items.map((f) => (
              <details key={f.q} className="group p-4" open={Boolean(q)}>
                <summary className="flex cursor-pointer list-none justify-between gap-4 font-medium">
                  Q. {f.q}
                  <span className="text-stone-400 transition group-open:rotate-45" aria-hidden>
                    ＋
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">A. {f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      {q && count === 0 && <p className="mt-10 text-center text-stone-500">該当する質問が見つかりませんでした。お問い合わせください。</p>}
    </>
  );
}
