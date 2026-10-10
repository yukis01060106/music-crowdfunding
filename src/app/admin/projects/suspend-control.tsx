"use client";

import { useEffect, useRef, useState } from "react";
import { resumeProject, suspendProject, useAdmin } from "@/lib/admin-store";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { DialogActions } from "../admin-ui";

export const STOP_REASONS = ["権利の侵害のおそれ（写真・楽曲）", "虚偽・誇大な内容", "リターンの不履行", "実行者と連絡が取れない"];

/** 掲載の停止のダイアログ（一覧と詳細ページで共通） */
export function StopDialog({ open, title, onClose, onDone }: { open: boolean; title: string; onClose: () => void; onDone: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title="掲載を停止する">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) return;
          onDone(reason.trim());
          setReason("");
        }}
      >
        <p className="text-sm">「{title}」を一覧と検索から外し、新しい支援を受け付けないようにします。すでに支援した人の記録は残ります。</p>
        <div>
          <p className="mb-2 text-xs font-bold text-stone-500">理由のひな形</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {STOP_REASONS.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => setReason(t)} aria-pressed={reason === t} className="min-h-11 w-full border border-stone-500 bg-white px-3 py-2 text-left text-xs leading-relaxed hover:border-brand hover:text-brand aria-pressed:border-brand aria-pressed:bg-brand-soft">
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <label className="block text-sm">
          理由（実行者に知らせます）
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} className={inputClass} />
        </label>
        <DialogActions onCancel={onClose} label="掲載を停止する" disabled={!reason.trim()} danger />
      </form>
    </Dialog>
  );
}

/** 掲載の再開のダイアログ。停止と同じく、確かめてから行い、メモを記録に残せる */
export function ResumeDialog({ open, title, onClose, onDone }: { open: boolean; title: string; onClose: () => void; onDone: (note?: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title="掲載を再開する">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onDone(note.trim() || undefined);
          setNote("");
        }}
      >
        <p className="text-sm">「{title}」を一覧と検索に戻し、支援の受付を再開します。</p>
        <label className="block text-sm">
          再開する理由（任意・記録に残します）
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className={inputClass} placeholder="例：権利者から許諾の書類が届いた" />
        </label>
        <DialogActions onCancel={onClose} label="掲載を再開する" />
      </form>
    </Dialog>
  );
}

/** 掲載の状態と、停止・再開の操作（プロジェクトの詳細ページ用）。#stop 付きで開くと、停止のダイアログを開く */
export function SuspendControl({ slug, title }: { slug: string; title: string }) {
  const { suspendedProjects } = useAdmin();
  const stop = suspendedProjects[slug];
  const [dialog, setDialog] = useState<"stop" | "resume" | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const open = () => {
      if (window.location.hash !== "#stop") return;
      setDialog("stop");
      history.replaceState(null, "", window.location.pathname);
    };
    open();
    // 同じページでハッシュだけ変わったときも開く
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  // 操作の後は、ボタンが入れ替わるので、状態の表示にフォーカスを移す（続けて Enter を押しても何も起きないように）
  const focusStatus = () => setTimeout(() => statusRef.current?.focus(), 50);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p ref={statusRef} tabIndex={-1} className="flex flex-wrap items-center gap-2 text-sm">
        {stop ? (
          <>
            <span className="text-xs text-stone-600">停止の理由：{stop}</span>
          </>
        ) : (
          <span className="sr-only">掲載中</span>
        )}
      </p>
      {stop ? (
        <button type="button" onClick={() => setDialog("resume")} className={buttonClass("secondary", "md")}>
          掲載を再開する
        </button>
      ) : (
        <button type="button" onClick={() => setDialog("stop")} className="min-h-11 px-2 text-sm text-rose-700 underline underline-offset-4 hover:text-rose-900">
          掲載を停止する
        </button>
      )}

      <StopDialog
        open={dialog === "stop"}
        title={title}
        onClose={() => setDialog(null)}
        onDone={(reason) => {
          suspendProject(slug, title, reason);
          toast(`「${title}」の掲載を停止しました`);
          setDialog(null);
          focusStatus();
        }}
      />
      <ResumeDialog
        open={dialog === "resume"}
        title={title}
        onClose={() => setDialog(null)}
        onDone={(note) => {
          resumeProject(slug, title, note);
          toast(`「${title}」の掲載を再開しました`);
          setDialog(null);
          focusStatus();
        }}
      />
    </div>
  );
}
