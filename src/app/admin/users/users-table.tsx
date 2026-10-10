"use client";

import { useState } from "react";
import { formatDate, formatYen } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";
import { chipClass } from "@/components/ui/chip";
import { buttonClass } from "@/components/ui/button";
import { inputClass, searchInputClass } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { approveIdentity, requestResubmit, resumeUser, suspendUser, useAdmin } from "@/lib/admin-store";
import { DemoNote, DialogActions, TableBox, TD, TH } from "../admin-ui";
import { useLiveUsers } from "../live-data";
import type { AdminUser } from "../admin-data";

const ROLES = [
  { key: "all", label: "すべて" },
  { key: "supporter", label: "支援者" },
  { key: "creator", label: "実行者" },
] as const;

/** 本人確認の書類で照らし合わせる項目 */
const ID_CHECKS = ["書類の氏名が、登録の氏名・振込先口座の名義と同じ", "生年月日（18歳未満なら保護者の同意書がある）", "書類の有効期限が切れていない", "顔写真と、書類を持った本人の写真が同じ人"];

// TODO（本番）: ユーザーは Supabase からサーバーで検索する。利用停止は Auth のユーザーを無効にし、理由を本人に知らせる
// TODO（本番）: 本人確認の書類は Supabase Storage の非公開バケットに置き、運営ロールだけに短い有効期限の署名付き URL で見せる。
//   閲覧と承認は監査ログに残す。できれば Stripe Connect の本人確認に任せ、自前で書類を持たない
export function UsersTable({ users: base }: { users: AdminUser[] }) {
  // このブラウザでログインしている人も並べる
  const users = useLiveUsers(base);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["key"]>("all");
  // 保存した操作（停止・承認など）を、見本のデータの上に重ねる
  const admin = useAdmin();
  const status: Record<string, AdminUser["status"]> = Object.fromEntries(users.map((u) => [u.id, admin.userStatus[u.id] ?? u.status]));
  const verified: Record<string, boolean> = Object.fromEntries(users.map((u) => [u.id, admin.verified[u.id] ?? u.verified]));
  const resubmit = admin.resubmit;
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [idTarget, setIdTarget] = useState<AdminUser | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");

  const q = query.trim().toLowerCase();
  const shown = users.filter((u) => (role === "all" || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));
  const allChecked = ID_CHECKS.every((c) => checks[c]);

  function idCell(u: AdminUser) {
    if (u.role !== "creator") return <span className="text-xs text-stone-500">—</span>;
    if (verified[u.id]) return <span className={tagClass("success")}>✓ 確認済み</span>;
    if (resubmit[u.id]) return <span className={tagClass("warning")}>書類の出し直しを依頼中</span>;
    return (
      <button
        type="button"
        onClick={() => {
          setIdTarget(u);
          setChecks({});
          setReason("");
        }}
        aria-label={`${u.name}さんの本人確認の書類を確認する`}
        className={buttonClass("dark", "md", "whitespace-nowrap")}
      >
        書類を確認する
      </button>
    );
  }

  function actionButton(u: AdminUser) {
    return status[u.id] === "suspended" ? (
      <button
        type="button"
        onClick={() => {
          resumeUser(u.id, u.name);
          toast(`${u.name}さんの利用を再開しました`);
        }}
        aria-label={`${u.name}さんの利用を再開する`}
        className={buttonClass("secondary", "md", "whitespace-nowrap")}
      >
        利用を再開
      </button>
    ) : (
      // 停止は強い操作だが、表の中でいちばん目立たないよう控えめにする（確定はダイアログで）
      <button
        type="button"
        onClick={() => {
          setSuspendTarget(u);
          setReason("");
        }}
        aria-label={`${u.name}さんの利用を停止する`}
        className="min-h-11 whitespace-nowrap px-2 text-sm text-rose-700 underline underline-offset-4 hover:text-rose-900"
      >
        利用を停止
      </button>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">名前・メールアドレスで検索</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="名前・メールアドレスで検索" className={searchInputClass} />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="種類で絞り込む">
          {ROLES.map((r) => (
            <button key={r.key} type="button" aria-pressed={role === r.key} onClick={() => setRole(r.key)} className={chipClass(role === r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-2 text-sm text-stone-500" aria-live="polite">
        {shown.length}人を表示
      </p>
      <TableBox label="ユーザーの一覧" minWidth={640}>
        <thead className="bg-stone-50">
          <tr>
            <th className={TH}>ユーザー</th>
            <th className={TH}>種類</th>
            <th className={`${TH} hidden md:table-cell`}>本人確認</th>
            <th className={`${TH} text-right`}>支援の合計</th>
            <th className={TH}>登録日</th>
            <th className={`${TH} hidden md:table-cell`}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {shown.map((u) => {
            const suspended = status[u.id] === "suspended";
            return (
              <tr key={u.id} className={suspended ? "bg-stone-50 text-stone-500" : undefined}>
                <th scope="row" className={`${TD} text-left font-normal`}>
                  <span className="font-bold">{u.name}</span>
                  <span className="block text-xs text-stone-500">{u.email}</span>
                  {/* スマホでは表の右端が見えにくいので、操作を名前の下に出す */}
                  <span className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
                    {u.role === "creator" && idCell(u)}
                    {actionButton(u)}
                  </span>
                </th>
                <td className={TD}>
                  <span className={tagClass(u.role === "creator" ? "brand" : "neutral")}>{u.role === "creator" ? "実行者" : "支援者"}</span>
                  {suspended && <span className={tagClass("warning", "ml-1")}>利用停止</span>}
                </td>
                <td className={`${TD} hidden md:table-cell`}>{idCell(u)}</td>
                <td className={`${TD} text-right`}>{u.backed > 0 ? formatYen(u.backed) : "—"}</td>
                <td className={`${TD} text-stone-600`}>{formatDate(u.joinedAt)}</td>
                <td className={`${TD} hidden text-right md:table-cell`}>{actionButton(u)}</td>
              </tr>
            );
          })}
          {shown.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-stone-500">
                当てはまるユーザーはいません
              </td>
            </tr>
          )}
        </tbody>
      </TableBox>

      <Dialog open={idTarget !== null} onClose={() => setIdTarget(null)} title="本人確認の書類">
        {idTarget && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!allChecked) return;
              approveIdentity(idTarget.id, idTarget.name);
              toast(`${idTarget.name}さんの本人確認を承認しました`);
              setIdTarget(null);
            }}
          >
            <p className="text-sm">{idTarget.name}さん（{idTarget.email}）が提出した書類です。</p>
            <div className="grid grid-cols-2 gap-2" aria-label="提出された書類（見本）">
              {["書類の表面", "書類を持った本人の写真"].map((label) => (
                <div key={label} className="flex aspect-[4/3] items-center justify-center border border-dashed border-stone-400 bg-stone-50 p-2 text-center text-xs text-stone-500">
                  （デモ）{label}
                </div>
              ))}
            </div>
            <fieldset className="space-y-1">
              <legend className="mb-1 text-sm font-bold">照らし合わせる項目</legend>
              {ID_CHECKS.map((c) => (
                <label key={c} className="flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" checked={Boolean(checks[c])} onChange={(e) => setChecks((x) => ({ ...x, [c]: e.target.checked }))} className="size-5 shrink-0 accent-brand" />
                  {c}
                </label>
              ))}
            </fieldset>
            <label className="block text-sm">
              差し戻すときの理由（本人に送ります）
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} className={inputClass} placeholder="例：書類の文字が読み取れないため、撮り直して提出してください。" />
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={() => {
                  requestResubmit(idTarget.id, idTarget.name, reason.trim());
                  toast(`${idTarget.name}さんに、書類の出し直しをお願いしました`);
                  setIdTarget(null);
                }}
                className={buttonClass("secondary")}
              >
                差し戻す
              </button>
              <button type="submit" disabled={!allChecked} className={buttonClass("primary")}>
                承認する
              </button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog open={suspendTarget !== null} onClose={() => setSuspendTarget(null)} title="利用を停止する">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!suspendTarget || !reason.trim()) return;
            suspendUser(suspendTarget.id, suspendTarget.name, reason.trim());
            toast(`${suspendTarget.name}さんの利用を停止しました`);
            setSuspendTarget(null);
          }}
        >
          <p className="text-sm">{suspendTarget?.name}さんがログインできないようにします。実行者の場合、募集中のプロジェクトは別に「掲載の停止」が必要です。</p>
          <label className="block text-sm">
            理由（本人に知らせます）
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} className={inputClass} placeholder="例：利用規約 第9条（禁止事項）に当たる宣伝の書き込み" />
          </label>
          <DialogActions onCancel={() => setSuspendTarget(null)} label={`${suspendTarget?.name ?? ""}さんの利用を停止する`} disabled={!reason.trim()} danger />
        </form>
      </Dialog>

      <DemoNote>デモのため、登録しているユーザーと書類は見本です。本番では、メールアドレスや書類などの個人情報は運営の担当者だけが見られるようにし、見た記録を残します。</DemoNote>
    </>
  );
}
