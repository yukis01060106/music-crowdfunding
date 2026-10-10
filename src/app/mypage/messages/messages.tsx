"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Artist, Project } from "@/types";
import { markThreadRead, sendMessage, useDemo } from "@/lib/demo-store";
import { formatDateTime } from "@/lib/format";
import { Photo } from "@/components/ui/photo";
import { toast } from "@/components/ui/toast";

const formatAt = formatDateTime;

const SUBJECTS = ["リターンについて", "お届け先の変更", "支援について", "その他"];

// TODO: メッセージは Supabase に保存し、実行者にはメールでも通知する
export function Messages({ projects, artists }: { projects: Project[]; artists: Artist[] }) {
  const { threads } = useDemo();
  const to = useSearchParams().get("to");
  const [activeId, setActiveId] = useState<string | null>(threads.find((t) => t.projectSlug === to)?.id ?? (to ? null : threads[0]?.id ?? null));
  const [composing, setComposing] = useState(to !== null && !threads.some((t) => t.projectSlug === to) ? to : null);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [draft, setDraft] = useState("");

  const active = threads.find((t) => t.id === activeId);
  const projectOf = (slug: string) => projects.find((p) => p.slug === slug);
  const artistOf = (p?: Project) => artists.find((a) => a.id === p?.artistId);
  const composingProject = composing ? projectOf(composing) : undefined;

  function send() {
    const body = draft.trim();
    if (!body) return;
    if (composingProject) {
      sendMessage(composingProject.slug, body, subject);
      setComposing(null);
    } else if (active) {
      sendMessage(active.projectSlug, body, active.subject);
    }
    setDraft("");
    toast("メッセージを送りました");
  }

  // 新規作成で送ったら、作られたスレッドを開く
  const shownThread = active ?? (composing === null ? threads.find((t) => t.projectSlug === to) ?? threads[0] : undefined);
  // 表示したスレッドは既読にする（クリックしなくても、最初に開いたものを読んだことにする）
  const shownUnread = shownThread?.unread ? shownThread.id : null;
  useEffect(() => {
    if (shownUnread) markThreadRead(shownUnread);
  }, [shownUnread]);
  const headerProject = composingProject ?? (shownThread && projectOf(shownThread.projectSlug));

  if (threads.length === 0 && !composingProject) {
    return (
      <div className="border-2 border-dashed border-stone-300 p-10 text-center">
        <p className="text-stone-500">メッセージはまだありません。プロジェクトのページの「実行者に質問する」から送れます。</p>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden border border-stone-200 bg-white md:grid-cols-[260px_1fr]">
      <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto border-b border-stone-200 md:max-h-none md:border-b-0 md:border-r">
        {composingProject && (
          <li className="bg-brand-soft p-4 text-sm">
            <span className="font-bold text-brand">新しいメッセージ</span>
            <span className="mt-0.5 block truncate text-xs text-stone-500">{composingProject.title}</span>
          </li>
        )}
        {threads.map((t) => {
          const p = projectOf(t.projectSlug);
          const selected = !composingProject && shownThread?.id === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(t.id);
                  setComposing(null);
                  markThreadRead(t.id);
                }}
                aria-current={selected ? "true" : undefined}
                className={`flex w-full gap-3 p-4 text-left transition ${selected ? "bg-brand-soft" : "hover:bg-stone-50"}`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">{p && <Photo src={artistOf(p)?.photo ?? p.cover} alt="" sizes="40px" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{artistOf(p)?.name}</span>
                    {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="未読" />}
                  </span>
                  <span className="block truncate text-xs text-stone-500">{t.subject}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex min-h-[440px] flex-col">
        {headerProject && (
          <div className="border-b border-stone-100 p-4">
            <p className="font-bold">{composingProject ? "新しいメッセージ" : shownThread?.subject}</p>
            <Link href={`/projects/${headerProject.slug}`} className="text-xs text-stone-500 hover:text-brand">
              {artistOf(headerProject)?.name}・{headerProject.title}
            </Link>
          </div>
        )}
        {composingProject ? (
          <div className="flex-1 p-4">
            <label className="block text-sm">
              件名
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full border border-stone-500 bg-white px-3 py-2">
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">
              よくある質問は、プロジェクトページの「よくある質問」にも載っています。返信が届くと、メールでもお知らせします。
            </p>
          </div>
        ) : (
          <ol key={shownThread?.id} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {shownThread?.messages.map((m, i) => (
              <li key={i} className={`flex animate-rise ${m.from === "me" ? "justify-end" : ""}`}>
                <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${m.from === "me" ? "bg-brand text-white" : "bg-stone-100"}`}>
                  <span className="sr-only">{m.from === "me" ? "あなた：" : `${artistOf(headerProject)?.name ?? "実行者"}：`}</span>
                  <span className="whitespace-pre-wrap">{m.body}</span>
                  <p className={`mt-1 text-[11px] ${m.from === "me" ? "text-white/80" : "text-stone-500"}`}>{formatAt(m.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="flex gap-2 border-t border-stone-100 p-4">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="メッセージを書く" aria-label="メッセージ" className="flex-1 border border-stone-500 p-2 text-sm focus:border-brand focus:outline-none" />
          <button type="button" onClick={send} disabled={!draft.trim()} className={buttonClass("dark", "md", "self-end")}>
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
