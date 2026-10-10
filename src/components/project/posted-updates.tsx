"use client";

import type { Project } from "@/types";
import { useDemo, useHydrated } from "@/lib/demo-store";
import { formatDate } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { tagClass } from "@/components/ui/tag";
import { BackersOnly } from "./backers-only";

/**
 * 実行者の画面から投稿した活動報告（このブラウザに保存）。見本の活動報告の上に、新しい順に出す。
 * TODO（本番）: 活動報告は Supabase から取得し、投稿したらプロジェクトのページを再検証する
 */
export function PostedUpdates({ project, hasOthers }: { project: Pick<Project, "slug" | "status" | "endAt">; hasOthers: boolean }) {
  const { postedUpdates } = useDemo();
  const hydrated = useHydrated();
  const now = useNow();
  const mine = postedUpdates.filter((u) => u.projectSlug === project.slug);
  // サーバーで描画するときも、ほかに活動報告がなければ「まだありません」を出す（空のページにしない）
  if (!hydrated) return hasOthers ? null : <p className="py-10 text-center text-stone-500">まだ活動報告はありません。</p>;
  if (mine.length === 0) return hasOthers ? null : <p className="py-10 text-center text-stone-500">まだ活動報告はありません。</p>;
  return (
    <ol className="mb-4 space-y-4">
      {mine.map((u) => (
        <li key={u.id} className="animate-rise border border-stone-200 bg-white p-5">
          <p className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            {formatDate(u.publishedAt)}
            {now !== null && now - Date.parse(u.publishedAt) < 7 * 24 * 60 * 60 * 1000 && <span className={tagClass("brand")}>NEW</span>}
            {u.backersOnly && <span className={tagClass("warning")}>支援者限定</span>}
          </p>
          <h2 className="mt-1 font-bold">{u.title}</h2>
          {u.backersOnly ? <BackersOnly project={project} body={u.body} /> : <p className="mt-2 whitespace-pre-wrap text-stone-700">{u.body}</p>}
        </li>
      ))}
    </ol>
  );
}
