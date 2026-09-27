"use client";

import { useState } from "react";

interface Message {
  from: "backer" | "me";
  body: string;
  at: string;
}

interface Thread {
  id: string;
  name: string;
  reward?: string;
  subject: string;
  unread: boolean;
  messages: Message[];
}

// モック: 支援者からの問い合わせ
const THREADS: Thread[] = [
  {
    id: "t1",
    name: "radio_listener",
    reward: "レコ発ワンマンの招待チケット",
    subject: "チケットの名義について",
    unread: true,
    messages: [{ from: "backer", body: "招待チケットは友だちに譲っても大丈夫ですか？当日行けなくなるかもしれなくて…", at: "9月24日 21:12" }],
  },
  {
    id: "t2",
    name: "ゆう",
    reward: "サイン入りCD＋先行配信",
    subject: "サインの宛名",
    unread: true,
    messages: [{ from: "backer", body: "サインに「ゆうへ」と名前を入れてもらうことはできますか？", at: "9月23日 08:40" }],
  },
  {
    id: "t3",
    name: "haru",
    reward: "アルバム音源を先行配信",
    subject: "配信の形式",
    unread: false,
    messages: [
      { from: "backer", body: "先行配信はハイレゾでも受け取れますか？", at: "9月20日 19:05" },
      { from: "me", body: "ご支援ありがとうございます！MP3とFLAC（24bit/48kHz）の両方をお届けする予定です。", at: "9月20日 22:30" },
    ],
  },
];

/** よく使う返信の定型文 */
const TEMPLATES = [
  "ご支援ありがとうございます！",
  "確認して、あらためてご連絡します。少しお待ちください。",
  "お届け時期が決まりしだい、活動報告でお知らせします。",
];

export function Inbox() {
  const [threads, setThreads] = useState(THREADS);
  const [activeId, setActiveId] = useState(THREADS[0].id);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  function open(id: string) {
    setActiveId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  }

  function send() {
    if (!draft.trim()) return;
    const now = new Date().toLocaleString("ja-JP", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    setThreads((prev) => prev.map((t) => (t.id === active.id ? { ...t, messages: [...t.messages, { from: "me", body: draft.trim(), at: now }] } : t)));
    setDraft("");
  }

  return (
    <div className="grid overflow-hidden border border-stone-200 bg-white md:grid-cols-[260px_1fr]">
      <ul className="divide-y divide-stone-100 border-b border-stone-200 md:border-b-0 md:border-r">
        {threads.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => open(t.id)} className={`block w-full p-4 text-left transition ${t.id === active.id ? "bg-brand-soft" : "hover:bg-stone-50"}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold">{t.name}</span>
                {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="未読" />}
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
          </p>
        </div>
        <ol key={active.id} className="flex-1 space-y-3 overflow-y-auto p-4">
          {active.messages.map((m, i) => (
            <li key={i} className={`flex animate-rise ${m.from === "me" ? "justify-end" : ""}`}>
              <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${m.from === "me" ? "bg-brand text-white" : "bg-stone-100"}`}>
                {m.body}
                <p className={`mt-1 text-[10px] ${m.from === "me" ? "text-white/70" : "text-stone-400"}`}>{m.at}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="space-y-2 border-t border-stone-100 p-4">
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button key={t} type="button" onClick={() => setDraft((d) => (d ? `${d}\n${t}` : t))} className="rounded-full border border-stone-300 px-2.5 py-1 text-[11px] text-stone-600 hover:border-brand hover:text-brand">
                {t.slice(0, 14)}…
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="返信を書く" aria-label="返信" className="flex-1 rounded-lg border border-stone-300 p-2 text-sm focus:border-brand focus:outline-none" />
            <button type="button" onClick={send} disabled={!draft.trim()} className="self-end bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand disabled:bg-stone-300">
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
