"use client";

import { useState } from "react";
import { AUDIT_LABELS, resetAdminDemo, useAdmin, type AuditEntry } from "@/lib/admin-store";
import { useHydrated } from "@/lib/demo-store";
import { IS_DEMO } from "@/lib/site";
import { formatDateTimeFull, isoJst, jstDateKey } from "@/lib/format";
import { downloadCsv, toCsv } from "@/lib/csv";
import { tagClass } from "@/components/ui/tag";
import { chipClass } from "@/components/ui/chip";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { DemoNote, TableBox, TD, TH } from "../admin-ui";

const GROUPS = [
  { key: "all", label: "すべて" },
  { key: "project", label: "プロジェクト" },
  { key: "money", label: "お金" },
  { key: "user", label: "ユーザー" },
  { key: "inbox", label: "問い合わせ" },
  { key: "review", label: "審査" },
  { key: "fes", label: "FES" },
] as const;

const groupOf = (e: AuditEntry) => AUDIT_LABELS[e.action].group;

// TODO（本番）: 記録は admin_audit_logs に追記だけできる形で残し、運営ロールだけが読める。消したり書き換えたりはできないようにする
export function AuditLog() {
  const { log } = useAdmin();
  const hydrated = useHydrated();
  const [group, setGroup] = useState<(typeof GROUPS)[number]["key"]>("all");
  const [resetting, setResetting] = useState(false);
  const shown = log.filter((e) => group === "all" || groupOf(e) === group);

  function download() {
    const rows = [["日時", "操作した人", "操作", "対象", "理由・内容"], ...shown.map((e) => [isoJst(e.at), e.operator, AUDIT_LABELS[e.action].label, e.target, e.detail ?? ""])];
    downloadCsv(`admin-log-${jstDateKey()}.csv`, toCsv(rows));
    toast(`${shown.length}件の記録を CSV でダウンロードしました`);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="操作の種類で絞り込む">
          {GROUPS.map((g) => (
            <button key={g.key} type="button" aria-pressed={group === g.key} onClick={() => setGroup(g.key)} className={chipClass(group === g.key)}>
              {g.label}
            </button>
          ))}
        </div>
        {shown.length > 0 && (
          <button type="button" onClick={download} className={buttonClass("secondary", "md", "shrink-0")}>
            CSV をダウンロード
          </button>
        )}
      </div>
      <p className="mb-2 text-sm text-stone-500" aria-live="polite">
        {hydrated && log.length > 0 ? `${shown.length}件を表示` : ""}
      </p>
      {!hydrated ? (
        <div className="h-40 animate-pulse bg-stone-100" aria-label="読み込み中" />
      ) : shown.length === 0 ? (
        <p className="border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          {log.length === 0 ? "まだ記録はありません。ほかの画面で返金・停止・返信などをすると、ここに残ります。" : "この種類の記録はありません。"}
        </p>
      ) : (
        <TableBox label="操作の記録" minWidth={640}>
          <thead className="bg-stone-50">
            <tr>
              <th className={TH}>日時</th>
              <th className={TH}>操作</th>
              <th className={TH}>対象</th>
              <th className={TH}>理由・内容</th>
              <th className={TH}>操作した人</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {shown.map((e) => (
              <tr key={e.id}>
                <td className={`${TD} whitespace-nowrap text-stone-600`}>{formatDateTimeFull(e.at)}</td>
                <td className={TD}>
                  <span className={tagClass(e.action === "refund" || e.action.endsWith("suspend") ? "warning" : "neutral")}>{AUDIT_LABELS[e.action].label}</span>
                </td>
                <th scope="row" className={`${TD} text-left font-bold`}>
                  {e.target}
                </th>
                <td className={`${TD} max-w-xs text-xs leading-relaxed text-stone-600`}>{e.detail ?? "—"}</td>
                <td className={`${TD} whitespace-nowrap text-xs text-stone-500`}>{e.operator}</td>
              </tr>
            ))}
          </tbody>
        </TableBox>
      )}

      {IS_DEMO && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6">
            <p className="text-xs text-stone-500">デモの操作（停止・返金・返信など）と、この記録をすべて消して、最初の状態に戻します。</p>
            <button type="button" onClick={() => setResetting(true)} className={buttonClass("secondary", "md")}>
              デモを最初の状態に戻す
            </button>
          </div>
          <ConfirmDialog
            open={resetting}
            onClose={() => setResetting(false)}
            onConfirm={() => {
              resetAdminDemo();
              toast("デモを最初の状態に戻しました");
            }}
            title="デモを最初の状態に戻す"
            body="運営画面で行った操作と、操作の記録をすべて消します。実行者の画面から出された審査の申請は残ります。本番の記録は消せません（デモだけの機能です）。"
            confirmLabel="最初の状態に戻す"
            danger
          />
        </>
      )}

      <DemoNote>デモのため、記録はこのブラウザに保存しています（最新300件まで）。本番では、記録は運営のだれも消したり書き換えたりできない形で保管します。</DemoNote>
    </>
  );
}
