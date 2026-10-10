"use client";

import { useRef, useState } from "react";
import { formatDate, formatDateTime, formatYen } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { markPayoutPaid, notifyFailure, releasePayout, settleRefund, useAdmin } from "@/lib/admin-store";
import { useNow } from "@/lib/use-now";
import { downloadCsv, toCsv } from "@/lib/csv";
import { feeAmount, payoutAmount } from "@/lib/fees";
import { isoJst, jstDateKey } from "@/lib/format";
import { DialogActions, Kpi, TableBox, TD, TH } from "../admin-ui";
import { useLiveRefunds } from "../live-data";
import { REFUND_CAUSE_LABELS, REFUND_DECLINE_TEMPLATES, type PaymentFailure, type PayoutRecord, type RefundRequest } from "../admin-data";

// TODO（本番）: 返金・お断りの処理の順序と二重実行の防ぎ方は admin-data.ts と同じ方針（Server Action・条件付き更新・冪等キー・Webhook で確定・監査ログ）

const PAYMENT_STATE = { charged: "決済済み（振込前）", paid_out: "実行者へ振込済み", uncharged: "請求前（カードの登録だけ）" } as const;

export function RefundList({ items: base }: { items: RefundRequest[] }) {
  // このブラウザの支援者からの返金の相談も並べる
  const items = useLiveRefunds(base);
  const { refunds: results } = useAdmin();
  const [action, setAction] = useState<{ item: RefundRequest; kind: "refund" | "decline" } | null>(null);
  const [reason, setReason] = useState("");
  const resultRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  if (items.length === 0) return <p className="text-sm text-stone-500">返金の申し出はありません。</p>;

  function finish(item: RefundRequest, kind: "refunded" | "declined") {
    settleRefund(item.id, `${item.user}さん・${formatYen(item.amount)}（${item.project}）`, kind, kind === "declined" ? reason.trim() : undefined);
    toast(kind === "refunded" ? `${item.user}さんに${formatYen(item.amount)}を返金しました` : `${item.user}さんに、お断りの理由を送りました`);
    setAction(null);
    // ボタンが消えるので、結果の表示にフォーカスを移す（ダイアログが閉じてフォーカスを戻す処理の後に）
    setTimeout(() => resultRefs.current[item.id]?.focus(), 50);
  }

  return (
    <>
      <p className="mb-3 border-l-4 border-brand bg-brand-soft px-4 py-3 text-xs leading-relaxed text-ink">
        返金できるのは、二重決済などの誤り、実行者の都合による中止・内容の変更（利用規約 第7条）、法令に基づく場合です。支援者の都合による取り消しは、原則お受けしていません（第5条）。
      </p>
      <ul className="space-y-3">
        {items.map((r) => {
          const result = results[r.id];
          const cause = REFUND_CAUSE_LABELS[r.cause];
          return (
            <li key={r.id} id={r.id} className="scroll-mt-24 border border-stone-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">
                  {r.user}さん・{formatYen(r.amount)}
                </p>
                <p className="text-xs text-stone-500">{formatDate(r.requestedAt)} 受付</p>
              </div>
              <p className="mt-1 text-xs text-stone-500">{r.project}</p>
              <p className="mt-2 leading-relaxed">「{r.reason}」</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                <span className={tagClass(r.cause === "supporter" ? "warning" : "brand")}>{cause.label}</span>
                <span className={tagClass()}>{PAYMENT_STATE[r.paymentState]}</span>
                {r.cause === "creator" && <span className={tagClass(r.creatorConsent ? "success" : "warning")}>{r.creatorConsent ? "実行者の同意あり" : "実行者の同意を確認中"}</span>}
              </p>
              <p className="mt-1 text-xs text-stone-600">{cause.hint}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {result ? (
                  <span
                    ref={(el) => {
                      resultRefs.current[r.id] = el;
                    }}
                    tabIndex={-1}
                    className={tagClass(result.kind === "refunded" ? "success" : "neutral")}
                  >
                    {result.kind === "refunded" ? "返金済み" : "対象外と回答済み"}（{formatDateTime(result.at)}）
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setAction({ item: r, kind: "refund" })}
                      aria-label={`${r.user}さんに返金する`}
                      className={r.cause === "supporter" ? buttonClass("secondary", "md") : buttonClass("dark", "md")}
                    >
                      返金する
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAction({ item: r, kind: "decline" });
                        setReason(r.cause === "supporter" ? REFUND_DECLINE_TEMPLATES[0] : "");
                      }}
                      aria-label={`${r.user}さんの返金をお断りする`}
                      className={r.cause === "supporter" ? buttonClass("dark", "md") : buttonClass("secondary", "md")}
                    >
                      お断りする
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={action?.kind === "refund"} onClose={() => setAction(null)} title="返金する">
        {action && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              finish(action.item, "refunded");
            }}
          >
            <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
              <dt className="text-stone-500">支援者</dt>
              <dd>{action.item.user}さん</dd>
              <dt className="text-stone-500">プロジェクト</dt>
              <dd>{action.item.project}</dd>
              <dt className="text-stone-500">返金額</dt>
              <dd className="font-bold">{formatYen(action.item.amount)}</dd>
              <dt className="text-stone-500">種類</dt>
              <dd>{REFUND_CAUSE_LABELS[action.item.cause].label}</dd>
            </dl>
            {action.item.cause === "supporter" && (
              <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">支援者の都合による申し出です。規約では原則お受けしていません。例外として返金する理由がある場合だけ進めてください。</p>
            )}
            <p className="text-sm">返金は元に戻せません。支援の記録も取り消し、支援者にメールで知らせます。</p>
            <DialogActions onCancel={() => setAction(null)} label={`${formatYen(action.item.amount)}を返金する`} danger />
          </form>
        )}
      </Dialog>

      <Dialog open={action?.kind === "decline"} onClose={() => setAction(null)} title="返金をお断りする">
        {action && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim()) finish(action.item, "declined");
            }}
          >
            <p className="text-sm">
              {action.item.user}さんに、お断りの理由をメールで送ります。
            </p>
            <div>
              <p className="mb-2 text-xs font-bold text-stone-500">理由のひな形</p>
              <ul className="space-y-2">
                {REFUND_DECLINE_TEMPLATES.map((t) => (
                  <li key={t}>
                    <button type="button" onClick={() => setReason(t)} aria-pressed={reason === t} className="min-h-11 w-full border border-stone-500 bg-white px-3 py-2 text-left text-xs leading-relaxed hover:border-brand hover:text-brand aria-pressed:border-brand aria-pressed:bg-brand-soft">
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <label className="block text-sm">
              理由（支援者に送ります）
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={1000} className={inputClass} />
            </label>
            <DialogActions onCancel={() => setAction(null)} label="お断りを送る" disabled={!reason.trim()} />
          </form>
        )}
      </Dialog>
    </>
  );
}

export function FailureList({ items }: { items: PaymentFailure[] }) {
  const { notified } = useAdmin();
  const doneRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  if (items.length === 0) return <p className="text-sm text-stone-500">決済の失敗はありません。</p>;
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 border border-stone-200 bg-white p-4 text-sm">
          <div className="min-w-0">
            <p className="font-bold">
              {f.user}さん・{formatYen(f.amount)}
              <span className={tagClass("neutral", "ml-2")}>{f.kind === "membership" ? "メンバーシップの更新" : "All-or-Nothing の請求"}</span>
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {f.target}・{formatDate(f.failedAt)}・{f.reason}・再請求 {f.retries}回
            </p>
          </div>
          {notified[f.id] ? (
            <span
              ref={(el) => {
                doneRefs.current[f.id] = el;
              }}
              tabIndex={-1}
              className={tagClass("success")}
            >
              連絡しました
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                notifyFailure(f.id, `${f.user}さん・${f.target}`);
                toast(`${f.user}さんに、カードの更新をお願いするメールを送りました`);
                // ボタンが消えるので、結果の表示にフォーカスを移す
                setTimeout(() => doneRefs.current[f.id]?.focus(), 50);
              }}
              aria-label={`${f.user}さんにカードの更新をお願いする`}
              className={buttonClass("secondary", "md")}
            >
              カードの更新をお願いする
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

const PAYOUT_STATUS = {
  scheduled: { label: "振込予定", tone: "brand" },
  paid: { label: "振込済み", tone: "success" },
  on_hold: { label: "保留", tone: "warning" },
} as const;

/** 終了したプロジェクトの振込。保留の解除と、振込済みへの切り替え（デモ）、CSV の書き出しができる */
export function PayoutTable({ items }: { items: PayoutRecord[] }) {
  const admin = useAdmin();
  const now = useNow();
  const statusOf = (p: PayoutRecord) => admin.payoutStatus[p.id] ?? p.status;
  const [action, setAction] = useState<{ item: PayoutRecord; kind: "release" | "paid" } | null>(null);
  const [note, setNote] = useState("");
  const resultRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  function download() {
    const rows = [
      ["プロジェクト", "実行者", "終了日", "集まった額", "手数料（税込）", "振込額", "振込予定日", "振込日（実績）", "状態"],
      ...items.map((p) => [p.title, p.artist, p.endedAt, p.raised, feeAmount(p.raised), payoutAmount(p.raised), p.scheduledAt, (admin.payoutPaidAt[p.id] ?? p.paidAt) ? isoJst(admin.payoutPaidAt[p.id] ?? `${p.paidAt}T00:00:00+09:00`) : "", PAYOUT_STATUS[statusOf(p)].label]),
    ];
    downloadCsv(`payouts-${jstDateKey()}.csv`, toCsv(rows));
    toast("振込の一覧を CSV でダウンロードしました");
  }

  function done(id: string) {
    setAction(null);
    // ボタンが消えるので、新しい状態の表示にフォーカスを移す（ダイアログがフォーカスを戻した後に）
    setTimeout(() => resultRefs.current[id]?.focus(), 50);
  }

  const target = (p: PayoutRecord) => `${p.title}（${p.artist}・${formatYen(payoutAmount(p.raised))}）`;
  const early = action?.kind === "paid" && now !== null && now < Date.parse(`${action.item.scheduledAt}T00:00:00+09:00`);

  return (
    <>
      <div className="mb-2 flex justify-end">
        <button type="button" onClick={download} className={buttonClass("secondary", "md")}>
          CSV をダウンロード
        </button>
      </div>
      <TableBox label="終了したプロジェクトの振込" minWidth={760}>
        <thead className="bg-stone-50">
          <tr>
            <th className={TH}>プロジェクト</th>
            <th className={`${TH} text-right`}>集まった額</th>
            <th className={`${TH} text-right`}>手数料（税込）</th>
            <th className={`${TH} text-right`}>振込額</th>
            <th className={TH}>振込日</th>
            <th className={TH}>状態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((p) => {
            const status = statusOf(p);
            const paidAt = admin.payoutPaidAt[p.id] ?? (p.paidAt ? `${p.paidAt}T00:00:00+09:00` : undefined);
            return (
              <tr key={p.id}>
                <th scope="row" className={`${TD} text-left font-normal`}>
                  <span className="font-bold">{p.title}</span>
                  <span className="block text-xs text-stone-500">
                    {p.artist}・{formatDate(p.endedAt)} 終了
                  </span>
                </th>
                <td className={`${TD} text-right`}>{formatYen(p.raised)}</td>
                <td className={`${TD} text-right text-stone-500`}>−{formatYen(feeAmount(p.raised))}</td>
                <td className={`${TD} text-right font-bold`}>{formatYen(payoutAmount(p.raised))}</td>
                <td className={`${TD} text-stone-600`}>
                  {paidAt ? (
                    <>
                      {formatDate(paidAt)}
                      <span className="block text-xs text-stone-500">実績（予定 {formatDate(p.scheduledAt)}）</span>
                    </>
                  ) : (
                    <>
                      {formatDate(p.scheduledAt)}
                      {status !== "paid" && <span className="block text-xs text-stone-500">予定</span>}
                    </>
                  )}
                </td>
                <td className={TD}>
                  <span
                    ref={(el) => {
                      resultRefs.current[p.id] = el;
                    }}
                    tabIndex={-1}
                    className={tagClass(PAYOUT_STATUS[status].tone)}
                  >
                    {PAYOUT_STATUS[status].label}
                  </span>
                  {status === "on_hold" && p.note && <span className="mt-1 block max-w-[14rem] text-xs text-stone-500">{p.note}</span>}
                  {status === "on_hold" && (
                    <button
                      type="button"
                      onClick={() => {
                        setNote("");
                        setAction({ item: p, kind: "release" });
                      }}
                      aria-label={`「${p.title}」の振込の保留を解除する`}
                      className={buttonClass("secondary", "md", "mt-2 whitespace-nowrap")}
                    >
                      保留を解除する
                    </button>
                  )}
                  {status === "scheduled" && (
                    <button
                      type="button"
                      onClick={() => {
                        setNote("");
                        setAction({ item: p, kind: "paid" });
                      }}
                      aria-label={`「${p.title}」を振込済みにする`}
                      className="mt-1 block min-h-11 text-xs text-brand underline underline-offset-4"
                    >
                      振込済みにする（デモ）
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>

      <Dialog open={action?.kind === "release"} onClose={() => setAction(null)} title="振込の保留を解除する">
        {action && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              releasePayout(action.item.id, target(action.item), note.trim());
              toast(`「${action.item.title}」の保留を解除し、振込予定にしました`);
              done(action.item.id);
            }}
          >
            <p className="text-sm">「{action.item.title}」の振込（{formatYen(payoutAmount(action.item.raised))}）を、振込予定に戻します。</p>
            {action.item.note && <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">保留の理由：{action.item.note}</p>}
            <label className="block text-sm">
              確かめたこと（記録に残します）
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className={inputClass} placeholder="例：口座の名義変更の届けを受け取り、本人確認の名義と一致した" />
            </label>
            <DialogActions onCancel={() => setAction(null)} label="保留を解除する" disabled={!note.trim()} />
          </form>
        )}
      </Dialog>

      <Dialog open={action?.kind === "paid"} onClose={() => setAction(null)} title="振込済みにする">
        {action && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              markPayoutPaid(action.item.id, target(action.item), note.trim() || undefined);
              toast(`「${action.item.title}」を振込済みにしました`);
              done(action.item.id);
            }}
          >
            <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
              <dt className="text-stone-500">振込先</dt>
              <dd>{action.item.artist}</dd>
              <dt className="text-stone-500">振込額</dt>
              <dd className="font-bold">{formatYen(payoutAmount(action.item.raised))}</dd>
              <dt className="text-stone-500">振込予定日</dt>
              <dd>{formatDate(action.item.scheduledAt)}</dd>
            </dl>
            {early && <p className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">振込予定日より前です。実際に振り込んだときだけ進めてください。振込日は今日の日付で残ります。</p>}
            <label className="block text-sm">
              メモ（任意・記録に残します）
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={inputClass} placeholder="例：振込の受付番号" />
            </label>
            <p className="text-xs text-stone-500">本番では、Stripe からの振込完了の通知（Webhook）で自動的に振込済みになります。</p>
            <DialogActions onCancel={() => setAction(null)} label="振込済みにする" />
          </form>
        )}
      </Dialog>
    </>
  );
}

/** お金の流れの数字。返金や振込の操作に合わせて、残りの件数・金額が変わる */
export function PaymentKpis({ refunds: base, failures, payouts, membershipPayout }: { refunds: RefundRequest[]; failures: PaymentFailure[]; payouts: PayoutRecord[]; membershipPayout: number }) {
  const admin = useAdmin();
  const refunds = useLiveRefunds(base);
  const openRefunds = refunds.filter((r) => !admin.refunds[r.id]).length;
  const openFailures = failures.filter((f) => !admin.notified[f.id]).length;
  const scheduled = payouts.filter((p) => (admin.payoutStatus[p.id] ?? p.status) !== "paid");
  const onHold = scheduled.filter((p) => (admin.payoutStatus[p.id] ?? p.status) === "on_hold").length;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="返金の申し出（未対応）" value={`${openRefunds}件`} href="#refunds" />
      <Kpi label="決済の失敗（未連絡）" value={`${openFailures}件`} href="#failures" />
      <Kpi
        label="これからの振込（終了済み）"
        value={formatYen(scheduled.reduce((s, p) => s + payoutAmount(p.raised), 0))}
        note={`${scheduled.length}件${onHold > 0 ? `（うち保留${onHold}件）` : ""}`}
        href="#payouts"
      />
      <Kpi label="メンバーシップの振込（翌月15日）" value={formatYen(membershipPayout)} href="#membership" />
    </div>
  );
}
