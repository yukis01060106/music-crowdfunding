"use client";

import Link from "next/link";
import { useDemo, useHydrated } from "@/lib/demo-store";
import { AUDIT_LABELS, useAdmin } from "@/lib/admin-store";
import { formatDateTime, formatYen } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";
import type { InboxItem, PaymentFailure, PayoutRecord, RefundRequest } from "./admin-data";
import { Kpi } from "./admin-ui";
import { useLiveInbox, useLiveRefunds } from "./live-data";

/** 読み込むまでの仮の表示（保存した操作を読む前の数字が一瞬見えないように） */
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-stone-100 ${className}`} aria-label="読み込み中" />;
}

/**
 * ダッシュボードの「対応が必要なもの」。保存した操作（返金した・返信したなど）を差し引いて、残りの件数を出す。
 * 審査待ちは、実行者画面から提出されたもの（このブラウザに保存）も数える
 */
export function TodoList({
  refunds: baseRefunds,
  failures,
  payouts,
  inbox: baseInbox,
  reviewIds,
}: {
  refunds: RefundRequest[];
  failures: PaymentFailure[];
  payouts: PayoutRecord[];
  inbox: InboxItem[];
  reviewIds: string[];
}) {
  const admin = useAdmin();
  const { submissions } = useDemo();
  const hydrated = useHydrated();
  const inbox = useLiveInbox(baseInbox);
  const refunds = useLiveRefunds(baseRefunds);
  const openInbox = inbox.filter((i) => (admin.inboxStatus[i.id] ?? i.status) !== "done");
  const todos = [
    { label: "返金の申し出", count: refunds.filter((r) => !admin.refunds[r.id]).length, href: "/admin/payments#refunds", tone: "warning" as const },
    { label: "決済の失敗", count: failures.filter((f) => !admin.notified[f.id]).length, href: "/admin/payments#failures", tone: "warning" as const },
    { label: "振込の保留", count: payouts.filter((p) => (admin.payoutStatus[p.id] ?? p.status) === "on_hold").length, href: "/admin/payments#payouts", tone: "warning" as const },
    { label: "通報", count: openInbox.filter((i) => i.kind === "report").length, href: "/admin/inbox", tone: "warning" as const },
    { label: "審査待ち", count: [...reviewIds, ...submissions.map((x) => x.id)].filter((id) => !admin.reviewDecisions[id]).length, href: "/admin/review", tone: "brand" as const },
    { label: "お問い合わせ", count: openInbox.filter((i) => i.kind === "inquiry").length, href: "/admin/inbox", tone: "brand" as const },
  ];
  if (!hydrated) return <Skeleton className="h-32" />;
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {todos.map((t) => (
        <li key={t.label}>
          <Link href={t.href} className="flex min-h-14 items-center justify-between gap-3 border border-stone-200 bg-white px-4 py-3 text-sm transition hover:border-brand">
            <span className="font-bold">{t.label}</span>
            <span className={t.count > 0 ? tagClass(t.tone) : tagClass("neutral")}>{t.count > 0 ? `${t.count}件` : "なし"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** ダッシュボードの「最近の操作」。操作の記録の新しい5件 */
export function RecentActivity() {
  const { log } = useAdmin();
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-24" />;
  if (log.length === 0) return <p className="border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">まだ操作の記録はありません。返金・停止・返信などをすると、ここに残ります。</p>;
  return (
    <ul className="divide-y divide-stone-100 border border-stone-200 bg-white text-sm">
      {log.slice(0, 5).map((e) => (
        <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-4">
          <span className={tagClass("neutral")}>{AUDIT_LABELS[e.action].label}</span>
          <span className="min-w-0 flex-1 truncate font-bold">{e.target}</span>
          <span className="text-xs text-stone-500">
            {e.operator}・{formatDateTime(e.at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

const INBOX_STATUS = { open: { label: "未対応", tone: "warning" }, in_progress: { label: "対応中", tone: "brand" }, done: { label: "完了", tone: "success" } } as const;

/** ダッシュボードの「新しい問い合わせ・通報」。完了にしたものは外す */
export function InboxPreview({ inbox: base }: { inbox: InboxItem[] }) {
  const admin = useAdmin();
  const inbox = useLiveInbox(base);
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-24" />;
  const rows = inbox
    .map((i) => ({ ...i, status: admin.inboxStatus[i.id] ?? i.status }))
    .filter((i) => i.status !== "done")
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
    .slice(0, 3);
  if (rows.length === 0) return <p className="border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">未完了の問い合わせ・通報はありません。</p>;
  return (
    <ul className="divide-y divide-stone-100 border border-stone-200 bg-white text-sm">
      {rows.map((i) => (
        <li key={i.id}>
          <Link href={`/admin/inbox#${i.id}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-4 transition hover:bg-brand-soft">
            <span className={tagClass(i.kind === "report" ? "warning" : "neutral")}>{i.kind === "report" ? "通報" : "問い合わせ"}</span>
            <span className="font-bold">{i.subject}</span>
            <span className={tagClass(INBOX_STATUS[i.status].tone)}>{INBOX_STATUS[i.status].label}</span>
            <span className="text-xs text-stone-500">
              {i.from}・{formatDateTime(i.receivedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 掲載中のプロジェクトの数字。掲載を停止したものは数えない */
export function LiveKpis({ rows, feeRate }: { rows: { slug: string; raised: number; earnsFee: boolean }[]; feeRate: number }) {
  const { suspendedProjects } = useAdmin();
  const live = rows.filter((r) => !suspendedProjects[r.slug]);
  const stopped = rows.length - live.length;
  return (
    <>
      <Kpi label="掲載中のプロジェクト" value={`${live.length}件`} note={stopped > 0 ? `ほかに掲載停止 ${stopped}件` : undefined} href="/admin/projects" />
      <Kpi label="募集中のプロジェクトの支援総額" value={formatYen(live.reduce((s, r) => s + r.raised, 0))} />
      <Kpi label="募集中から見込む手数料（税別）" value={formatYen(Math.floor(live.filter((r) => r.earnsFee).reduce((s, r) => s + r.raised, 0) * feeRate))} note="All-in と、目標に届いたもの" href="/admin/payments" />
    </>
  );
}
