"use client";

import Link from "next/link";
import type { ProjectStatus } from "@/types";
import { useAdmin } from "@/lib/admin-store";
import { useHydrated } from "@/lib/demo-store";
import { formatDate, formatDateTime, formatYen } from "@/lib/format";
import { STATUS_LABELS } from "@/app/creator/project-status";
import { TAG_BASE, tagClass } from "@/components/ui/tag";
import type { InboxItem, RefundRequest } from "../../admin-data";
import { useLiveInbox, useLiveRefunds } from "../../live-data";

/** 見出しの下の状態。掲載を停止していれば、データの状態（募集中など）の代わりに「掲載停止」を出す */
export function ProjectStatusTag({ slug, status }: { slug: string; status: ProjectStatus }) {
  const { suspendedProjects } = useAdmin();
  const hydrated = useHydrated();
  const label = STATUS_LABELS[status];
  // 保存した停止を読むまでは、データの状態（募集中）を一瞬見せないよう仮の表示にする
  if (!hydrated) return <span className="inline-block h-6 w-16 animate-pulse bg-stone-100" aria-hidden />;
  return suspendedProjects[slug] ? <span className={tagClass("warning")}>掲載停止</span> : <span className={`${TAG_BASE} ${label.className}`}>{label.label}</span>;
}

const INBOX_STATUS = { open: { label: "未対応", tone: "warning" }, in_progress: { label: "対応中", tone: "brand" }, done: { label: "完了", tone: "success" } } as const;

/** このプロジェクトへの問い合わせ・通報・返金。対応の状況を出し、終わったものは下へ回す */
export function RelatedList({ inbox: baseInbox, refunds: baseRefunds, slug, title }: { inbox: InboxItem[]; refunds: RefundRequest[]; slug: string; title: string }) {
  const admin = useAdmin();
  // このブラウザの支援者からの通報・返金の相談も足す
  const inbox = useLiveInbox(baseInbox).filter((i) => i.targetSlug === slug || i.target === title);
  const refunds = useLiveRefunds(baseRefunds).filter((r) => r.project === title);
  const hydrated = useHydrated();
  if (inbox.length === 0 && refunds.length === 0) return <p className="text-sm text-stone-500">ありません。</p>;
  if (!hydrated) return <div className="h-24 animate-pulse bg-stone-100" aria-label="読み込み中" />;
  const rows = [
    ...inbox.map((i) => {
      const status = admin.inboxStatus[i.id] ?? i.status;
      return {
        key: i.id,
        href: `/admin/inbox#${i.id}`,
        kind: <span className={tagClass(i.kind === "report" ? "warning" : "neutral")}>{i.kind === "report" ? "通報" : "問い合わせ"}</span>,
        title: i.subject,
        meta: `${i.from}・${formatDateTime(i.receivedAt)}`,
        state: <span className={tagClass(INBOX_STATUS[status].tone)}>{INBOX_STATUS[status].label}</span>,
        done: status === "done",
      };
    }),
    ...refunds.map((r) => {
      const result = admin.refunds[r.id];
      return {
        key: r.id,
        href: `/admin/payments#${r.id}`,
        kind: <span className={tagClass("warning")}>返金の申し出</span>,
        title: `${r.user}さん・${formatYen(r.amount)}`,
        meta: formatDate(r.requestedAt),
        state: result ? <span className={tagClass(result.kind === "refunded" ? "success" : "neutral")}>{result.kind === "refunded" ? "返金済み" : "対象外と回答済み"}</span> : <span className={tagClass("warning")}>未対応</span>,
        done: Boolean(result),
      };
    }),
  ].sort((a, b) => Number(a.done) - Number(b.done));
  return (
    <ul className="divide-y divide-stone-100 border border-stone-200 bg-white text-sm">
      {rows.map((row) => (
        <li key={row.key}>
          <Link href={row.href} className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 p-4 hover:bg-brand-soft ${row.done ? "bg-stone-50" : ""}`}>
            {row.kind}
            <span className="font-bold">{row.title}</span>
            {row.state}
            <span className="text-xs text-stone-500">{row.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
