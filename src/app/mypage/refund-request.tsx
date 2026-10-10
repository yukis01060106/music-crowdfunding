"use client";

import { useState } from "react";
import { addInquiry, own, useDemo } from "@/lib/demo-store";
import { useAdmin } from "@/lib/admin-store";
import { formatYen } from "@/lib/format";
import { Dialog } from "@/components/ui/dialog";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { tagClass } from "@/components/ui/tag";
import { toast } from "@/components/ui/toast";

const CAUSES = [
  { key: "duplicate", label: "同じ支援で二重に請求された" },
  { key: "creator", label: "プロジェクトが中止・変更になった" },
  { key: "supporter", label: "自分の都合で取り消したい" },
] as const;

/** この支援への返金の相談の状況（運営の画面での返金・お断りが、ここに届く） */
export function useRefundState(backingId: string): { kind: "none" | "pending" | "refunded" | "declined"; note?: string } {
  const { inquiries } = useDemo();
  const { refunds } = useAdmin();
  const req = inquiries.find((i) => i.kind === "refund" && i.backingId === backingId);
  if (!req) return { kind: "none" };
  const result = own(refunds, req.id);
  if (!result) return { kind: "pending" };
  return { kind: result.kind, note: result.note };
}

export function RefundStatusTag({ backingId }: { backingId: string }) {
  const state = useRefundState(backingId);
  if (state.kind === "none") return null;
  const map = {
    pending: { label: "返金を確認中", tone: "warning" },
    refunded: { label: "返金済み", tone: "success" },
    declined: { label: "返金の対象外", tone: "neutral" },
  } as const;
  const v = map[state.kind];
  return (
    <>
      <span className={tagClass(v.tone)}>{v.label}</span>
      {state.kind === "declined" && state.note && <span className="w-full text-xs text-stone-600">運営から：{state.note}</span>}
    </>
  );
}

/**
 * TODO（本番）: 返金の相談はサーバーで、backingId の持ち主がログイン中の本人かを確かめ、金額は支援の記録（Stripe の PaymentIntent）から取る。
 *   クライアントの amount は使わない。同じ支援への重なった相談はサーバーで断る
 * キャンセル・返金の相談。規約では、決済後の支援者の都合による取り消しは原則お受けしていないので、その旨を先に伝える。
 * 送った相談は運営の「お金の流れ」に届く
 */
export function RefundRequestButton({ backingId, projectSlug, projectTitle, amount }: { backingId: string; projectSlug: string; projectTitle: string; amount: number }) {
  const state = useRefundState(backingId);
  const [open, setOpen] = useState(false);
  // 理由は最初は選ばない（そのまま送って、誤った種類で運営に届かないように）
  const [cause, setCause] = useState<(typeof CAUSES)[number]["key"] | null>(null);
  const [body, setBody] = useState("");
  if (state.kind !== "none" || amount === 0) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center justify-center px-3 text-stone-600 underline underline-offset-4 hover:text-brand">
        キャンセル・返金の相談
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="キャンセル・返金の相談">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim() || !cause) return;
            addInquiry({ kind: "refund", subject: "返金の相談", body: body.trim(), backingId, amount, target: projectTitle, targetSlug: projectSlug, cause });
            toast("運営に相談を送りました。2営業日ほどで、この画面とメッセージでお知らせします");
            setOpen(false);
          }}
        >
          <p className="border-l-4 border-brand bg-brand-soft px-3 py-2 text-xs leading-relaxed text-ink">
            決済が完了した支援は、支援者の都合による取り消しを原則お受けしていません。二重の請求や、プロジェクトの中止・大きな変更のときは、返金の対象になることがあります（利用規約 第5条・第7条）。
          </p>
          <p className="text-sm">
            「{projectTitle}」への支援（{formatYen(amount)}）
          </p>
          <fieldset>
            <legend className="mb-2 text-sm font-bold">相談の理由（選んでください）</legend>
            {CAUSES.map((c) => (
              <label key={c.key} className="flex min-h-11 items-center gap-3 text-sm">
                <input type="radio" name="refund-cause" checked={cause === c.key} onChange={() => setCause(c.key)} className="size-5 accent-brand" />
                {c.label}
              </label>
            ))}
          </fieldset>
          <label className="block text-sm">
            くわしい内容
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000} className={inputClass} />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("secondary")}>
              やめる
            </button>
            <button type="submit" disabled={!body.trim() || !cause} className={buttonClass("primary")}>
              運営に相談する
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
