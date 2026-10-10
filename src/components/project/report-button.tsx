"use client";

import { useId, useState } from "react";
import { addInquiry } from "@/lib/demo-store";
import { Dialog } from "@/components/ui/dialog";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const REASONS = ["権利の侵害（写真・楽曲の無断使用）", "内容が事実と違う・誇大", "リターンが届かない", "コメント欄の宣伝・迷惑行為", "その他"];

/**
 * プロジェクトの問題を運営に知らせる。運営の「問い合わせ・通報」に届き、運営はそこから掲載を停止できる。
 * TODO（本番）: Supabase に保存し、同じ人からの連続した通報は回数を制限する
 */
export function ReportButton({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [body, setBody] = useState("");
  const hintId = useId();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-xs text-stone-500 underline underline-offset-4 hover:text-rose-700">
        問題を報告する
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="問題を報告する">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            addInquiry({ kind: "report", subject: reason, body: body.trim(), targetSlug: slug, target: title });
            toast("運営に報告しました。ご協力ありがとうございます");
            setOpen(false);
            setBody("");
          }}
        >
          <p className="text-sm text-stone-600">「{title}」について、気になる点を運営に知らせます。報告した人の名前は、実行者には伝わりません。</p>
          <fieldset>
            <legend className="mb-2 text-sm font-bold">報告の理由</legend>
            <div className="space-y-1">
              {REASONS.map((r) => (
                <label key={r} className="flex min-h-11 items-center gap-3 text-sm">
                  <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} className="size-5 accent-brand" />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm">
            くわしい内容
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000} required aria-describedby={hintId} className={inputClass} placeholder="例：2枚目の写真が、別のバンドの公式写真と同じです" />
          </label>
          <p id={hintId} className="text-xs text-stone-500">
            くわしい内容を書くと、報告できるようになります。
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("secondary")}>
              やめる
            </button>
            <button type="submit" disabled={!body.trim()} className={buttonClass("primary")}>
              報告する
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
