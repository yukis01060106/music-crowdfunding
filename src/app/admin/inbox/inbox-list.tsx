"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";
import { buttonClass } from "@/components/ui/button";
import { chipClass } from "@/components/ui/chip";
import { inputClass } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { markInboxInProgress, replyInbox, useAdmin } from "@/lib/admin-store";
import { DemoNote, DialogActions } from "../admin-ui";
import { useLiveInbox } from "../live-data";
import type { InboxItem } from "../admin-data";

type Status = InboxItem["status"];

const STATUS: Record<Status, { label: string; tone: "warning" | "brand" | "success" }> = {
  open: { label: "未対応", tone: "warning" },
  in_progress: { label: "対応中", tone: "brand" },
  done: { label: "完了", tone: "success" },
};

const FILTERS = [
  { key: "active", label: "未完了" },
  { key: "report", label: "通報だけ" },
  { key: "done", label: "完了" },
  { key: "all", label: "すべて" },
] as const;

// TODO: 問い合わせフォームと通報ボタンの送信を Supabase に保存し、返信はメールで送る
const logTarget = (i: InboxItem) => `${i.from}さん・${i.subject}${i.target ? `（${i.target}）` : ""}`;

export function InboxList({ items: base, templates }: { items: InboxItem[]; templates: string[] }) {
  // このブラウザの支援者からの連絡も、新しい順に並べる
  const items = useLiveInbox(base).sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("active");
  // 保存した対応の状況を、見本のデータの上に重ねる
  const admin = useAdmin();
  const status: Record<string, Status> = Object.fromEntries(items.map((i) => [i.id, admin.inboxStatus[i.id] ?? i.status]));
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const countRef = useRef<HTMLParagraphElement>(null);
  // 返信や対応中にすると、その行が一覧から消えることがあるので、件数の表示にフォーカスを移す
  const closeAndFocus = () => {
    setOpenId(null);
    setTimeout(() => countRef.current?.focus(), 50);
  };

  // ダッシュボードから（#ID 付きで）来たときは、その件を開く
  useEffect(() => {
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return; // 壊れたハッシュは無視する
    }
    // 支援者からの連絡は、保存した内容を読み込んでから一覧に入るので、件数が変わるたびに確かめる
    if (!id || !items.some((i) => i.id === id)) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- URL のハッシュはブラウザでしか読めない */
    setOpenId(id);
    history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const shown = items.filter((i) => {
    const s = status[i.id];
    if (filter === "active") return s !== "done";
    if (filter === "report") return i.kind === "report";
    if (filter === "done") return s === "done";
    return true;
  });
  const open = items.find((i) => i.id === openId);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="状態・種類で絞り込む">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className={chipClass(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <p ref={countRef} tabIndex={-1} className="mb-2 text-sm text-stone-500" aria-live="polite">
        {FILTERS.find((f) => f.key === filter)?.label} {shown.length}件
      </p>
      <ul className="space-y-2">
        {shown.map((i) => {
          const s = STATUS[status[i.id]];
          return (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  setOpenId(i.id);
                  setReply("");
                }}
                id={i.id}
                className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 border border-stone-200 bg-white p-4 text-left text-sm transition hover:border-brand"
              >
                <span className={tagClass(i.kind === "report" ? "warning" : "neutral")}>{i.kind === "report" ? "通報" : "問い合わせ"}</span>
                <span className="font-bold">{i.subject}</span>
                <span className={tagClass(s.tone)}>{s.label}</span>
                <span className="w-full text-xs text-stone-500">
                  {i.from}・{formatDateTime(i.receivedAt)}
                  {i.target && `・対象：${i.target}`}
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && <li className="border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">当てはまるものはありません</li>}
      </ul>

      <Dialog open={open !== undefined} onClose={() => setOpenId(null)} title={open?.subject ?? ""}>
        {open && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return;
              replyInbox(open.id, logTarget(open), reply.trim());
              toast(`${open.from}さんに返信しました`);
              closeAndFocus();
            }}
          >
            <p className="text-xs text-stone-500">
              {open.kind === "report" ? "通報" : "問い合わせ"}・{open.from}・{formatDateTime(open.receivedAt)}
              {open.target && `・対象：${open.target}`}
            </p>
            <p className="bg-stone-50 p-3 text-sm leading-relaxed">{open.body}</p>
            {(admin.inboxReplies[open.id] ?? []).map((rep, i) => (
              <div key={`${rep.at}-${i}`} className="ml-6 border-l-4 border-brand bg-brand-soft p-3 text-sm leading-relaxed">
                <p className="mb-1 text-xs text-stone-600">運営の返信・{formatDateTime(rep.at)}</p>
                {rep.body}
              </div>
            ))}
            {open.kind === "report" && open.targetSlug && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/projects/${encodeURIComponent(open.targetSlug)}`} className={buttonClass("secondary", "md")}>
                  対象のページを見る
                </Link>
                <Link href={`/admin/projects/${encodeURIComponent(open.targetSlug)}#stop`} className="inline-flex min-h-11 items-center px-2 text-sm text-rose-700 underline underline-offset-4 hover:text-rose-900">
                  このプロジェクトの掲載を停止する
                </Link>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-bold text-stone-500">返信のひな形</p>
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li key={t}>
                    <button type="button" onClick={() => setReply(t)} aria-pressed={reply === t} className="min-h-11 w-full border border-stone-500 bg-white px-3 py-2 text-left text-xs leading-relaxed hover:border-brand hover:text-brand aria-pressed:border-brand aria-pressed:bg-brand-soft">
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <label className="block text-sm">
              返信
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} maxLength={2000} className={inputClass} />
            </label>
            {status[open.id] === "open" && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    markInboxInProgress(open.id, logTarget(open));
                    toast("対応中にしました");
                    closeAndFocus();
                  }}
                  className={buttonClass("secondary", "md")}
                >
                  返信せずに対応中にする
                </button>
              </div>
            )}
            <DialogActions onCancel={() => setOpenId(null)} label={status[open.id] === "done" ? "追加で返信する" : "返信して完了にする"} disabled={!reply.trim()} />
          </form>
        )}
      </Dialog>

      <DemoNote>デモのため、返信はこの画面の中だけで完了になります。通報されたプロジェクトは「プロジェクト」の画面から掲載を停止できます。</DemoNote>
    </>
  );
}
