"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { own, replyAsArtist, replyToSample, useDemo, useHydrated } from "@/lib/demo-store";
import { buttonClass } from "@/components/ui/button";
import { tagClass } from "@/components/ui/tag";
import { toast } from "@/components/ui/toast";
import { CREATOR_PROJECT_SLUG } from "../creator-context";

interface Message {
  from: "backer" | "me";
  body: string;
  /** ISO の日時 */
  at: string;
}

interface InboxThread {
  id: string;
  name: string;
  reward?: string;
  subject: string;
  unread: boolean;
  messages: Message[];
  /** 支援者のマイページとつながっているスレッド（返信が支援者に届く） */
  live?: boolean;
}

// 見本の支援者からの問い合わせ（このブラウザの支援者とは別の人）
export const SAMPLE_THREADS: InboxThread[] = [
  {
    id: "t1",
    name: "radio_listener",
    reward: "レコ発ワンマンの招待チケット",
    subject: "チケットの名義について",
    unread: true,
    messages: [{ from: "backer", body: "招待チケットは友だちに譲っても大丈夫ですか？当日行けなくなるかもしれなくて…", at: "2026-09-24T21:12:00+09:00" }],
  },
  {
    id: "t3",
    name: "haru",
    reward: "アルバム音源を先行配信",
    subject: "配信の形式",
    unread: false,
    messages: [
      { from: "backer", body: "先行配信はハイレゾでも受け取れますか？", at: "2026-09-19T21:40:00+09:00" },
      { from: "me", body: "ご支援ありがとうございます！MP3とFLAC（24bit/48kHz）の両方をお届けする予定です。", at: "2026-09-20T22:30:00+09:00" },
    ],
  },
];

/** よく使う返信の定型文 */
const TEMPLATES = ["ご支援ありがとうございます！", "確認して、あらためてご連絡します。少しお待ちください。", "お届け時期が決まりしだい、活動報告でお知らせします。"];

// TODO（本番）: メッセージは Supabase に保存し、新着は Realtime で受け取る。支援者にはメールでも通知する
export function Inbox() {
  const { threads: myThreads, user, sampleReplies } = useDemo();
  const hydrated = useHydrated();
  // 見本のスレッドにも、保存した返信を足す（ダッシュボードの未返信の数と合わせる）
  const samples: InboxThread[] = SAMPLE_THREADS.map((t) => {
    const replies = (own(sampleReplies, t.id) ?? []).map((m) => ({ from: "me" as const, body: m.body, at: m.at }));
    const messages = [...t.messages, ...replies];
    return { ...t, messages, unread: messages.at(-1)?.from === "backer" };
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // 支援者（このブラウザ）が送ったメッセージ。支援者から見た「me」は、実行者から見ると「backer」
  const live: InboxThread[] = myThreads
    .filter((t) => t.projectSlug === CREATOR_PROJECT_SLUG)
    .map((t) => ({
      id: t.id,
      name: user?.name ?? "支援者",
      subject: t.subject,
      // 最後のメッセージが支援者からなら、実行者にとって未返信
      unread: t.messages.at(-1)?.from === "me",
      live: true,
      messages: t.messages.map((m) => ({ from: m.from === "me" ? ("backer" as const) : ("me" as const), body: m.body, at: m.at })),
    }));
  const lastAt = (t: InboxThread) => Date.parse(t.messages.at(-1)?.at ?? "") || 0;
  const threads = [...live, ...samples].sort((a, b) => lastAt(b) - lastAt(a));
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  // 「未返信」は返信するまで消さない（開いただけでは消えない）
  const open = (id: string) => setActiveId(id);

  function send() {
    const body = draft.trim();
    if (!body || !active) return;
    if (active.live) {
      replyAsArtist(active.id, body);
      toast(`${active.name}さんに返信しました（マイページのメッセージに届きます）`);
    } else {
      replyToSample(active.id, body);
      toast(`${active.name}さんに返信しました`);
    }
    setDraft("");
  }

  if (!hydrated) return <div className="h-[420px] animate-pulse bg-stone-100" aria-label="読み込み中" />;
  if (!active) return <p className="border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">まだメッセージはありません。</p>;

  return (
    <div className="grid overflow-hidden border border-stone-200 bg-white md:grid-cols-[260px_1fr]">
      <ul className="divide-y divide-stone-100 border-b border-stone-200 md:border-b-0 md:border-r">
        {threads.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => open(t.id)} aria-current={t.id === active.id ? "true" : undefined} className={`block min-h-11 w-full p-4 text-left transition ${t.id === active.id ? "bg-brand-soft" : "hover:bg-stone-50"}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold">{t.name}</span>
                {t.unread && <span className={tagClass("brand")}>未返信</span>}
              </span>
              <span className="mt-0.5 block truncate text-xs text-stone-500">{t.subject}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex min-h-[420px] flex-col">
        <div className="border-b border-stone-100 p-4">
          <p className="font-bold">{active.subject}</p>
          <p className="text-xs text-stone-500">
            {active.name}さん{active.reward && `・${active.reward}`}
            {active.live && "・返信は支援者のマイページに届きます"}
          </p>
        </div>
        <ol key={active.id} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {active.messages.map((m, i) => (
            <li key={i} className={`flex animate-rise ${m.from === "me" ? "justify-end" : ""}`}>
              <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${m.from === "me" ? "bg-brand text-white" : "bg-stone-100"}`}>
                <span className="sr-only">{m.from === "me" ? "あなた：" : `${active.name}さん：`}</span>
                <span className="whitespace-pre-wrap">{m.body}</span>
                <p className={`mt-1 text-[11px] ${m.from === "me" ? "text-white/80" : "text-stone-500"}`}>{formatDateTime(m.at)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="space-y-2 border-t border-stone-100 p-4">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t} type="button" onClick={() => setDraft((d) => (d ? `${d}\n${t}` : t))} className="min-h-11 border border-stone-500 bg-white px-3 py-1 text-left text-xs hover:border-brand hover:text-brand">
                ＋ {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={2000} placeholder="返信を書く" aria-label="返信" className="flex-1 border border-stone-500 p-2 text-sm focus:border-brand focus:outline-none" />
            <button type="button" onClick={send} disabled={!draft.trim()} className={buttonClass("dark", "md", "self-end")}>
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
