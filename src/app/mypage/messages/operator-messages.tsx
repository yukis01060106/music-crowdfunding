"use client";

import { useEffect } from "react";
import Link from "next/link";
import { markOperatorSeen, own, useDemo, useHydrated } from "@/lib/demo-store";
import { useAdmin } from "@/lib/admin-store";
import { useOperatorNotices } from "@/lib/backing-state";
import { formatDateTime } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";

const KIND = { inquiry: "お問い合わせ", report: "通報", refund: "返金の相談" } as const;

/**
 * 運営とのやりとり。お問い合わせ・通報・返金の相談と、運営の返信・対応の結果（運営の画面での操作が、ここに届く）。
 * 支援したプロジェクトが掲載停止になったときのお知らせも、ここに出す
 */
export function OperatorMessages({ projects }: { projects: { slug: string; title: string }[] }) {
  const { inquiries, backings } = useDemo();
  const admin = useAdmin();
  const hydrated = useHydrated();
  const { totals } = useOperatorNotices();

  // 開いたら、届いている返信・結果を読んだことにする（ヘッダーの未読の数を減らす）
  const totalsKey = JSON.stringify(totals);
  useEffect(() => {
    if (hydrated && Object.keys(totals).length > 0) markOperatorSeen(totals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, totalsKey]);

  // 支援したプロジェクトのうち、運営が掲載を停止したもの
  const suspendedBacked = [...new Set(backings.map((b) => b.projectSlug))].filter((slug) => own(admin.suspendedProjects, slug));
  if (!hydrated || (inquiries.length === 0 && suspendedBacked.length === 0)) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 font-bold">運営とのやりとり</h2>
      <ul className="space-y-3">
        {suspendedBacked.map((slug) => (
          <li key={`suspend-${slug}`} className="border-l-4 border-rose-600 bg-rose-50 p-4 text-sm leading-relaxed text-rose-900">
            <p className="flex flex-wrap items-center gap-2">
              <span className={tagClass("danger")}>運営からのお知らせ</span>
              <span className="font-bold">支援したプロジェクトの掲載を停止しました</span>
            </p>
            <p className="mt-2">
              「{projects.find((p) => p.slug === slug)?.title ?? slug}」は、運営の確認のため掲載を停止しています。リターンのお届けや返金などの対応は、決まりしだいここでお知らせします。
              ご不安な点は
              <Link href="/contact" className="mx-1 font-bold underline">
                お問い合わせ
              </Link>
              からご連絡ください。
            </p>
          </li>
        ))}
        {inquiries.map((i) => {
          const replies = own(admin.inboxReplies, i.id) ?? [];
          const status = own(admin.inboxStatus, i.id);
          const refund = own(admin.refunds, i.id);
          // 通報したプロジェクトの掲載を運営が停止したら、対応したことがわかるように
          const reportHandled = i.kind === "report" && i.targetSlug && own(admin.suspendedProjects, i.targetSlug);
          const state =
            i.kind === "refund"
              ? refund
                ? { label: refund.kind === "refunded" ? "返金済み" : "返金の対象外", tone: refund.kind === "refunded" ? ("success" as const) : ("neutral" as const) }
                : { label: "返金を確認中", tone: "warning" as const }
              : status === "done"
                ? { label: "返信あり", tone: "success" as const }
                : reportHandled
                  ? { label: "対応しました", tone: "success" as const }
                  : status === "in_progress"
                    ? { label: "対応中", tone: "brand" as const }
                    : { label: "受付済み", tone: "warning" as const };
          return (
            <li key={i.id} className="border border-stone-200 bg-white p-4 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <span className={tagClass("neutral")}>{KIND[i.kind]}</span>
                {/* 件名が種類と同じ（返金の相談）なら、二重に出さない */}
                {i.subject !== KIND[i.kind] && <span className="font-bold">{i.subject}</span>}
                <span className={tagClass(state.tone)}>{state.label}</span>
                <span className="text-xs text-stone-500">{formatDateTime(i.receivedAt)}</span>
              </p>
              {i.target && <p className="mt-1 text-xs text-stone-500">対象：{i.target}</p>}
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-stone-700">{i.body}</p>
              {reportHandled && status !== "done" && <p className="mt-2 text-xs text-stone-600">ご報告ありがとうございました。運営で確認し、対象のプロジェクトの掲載を停止しました。</p>}
              {replies.map((r, idx) => (
                <div key={`${r.at}-${idx}`} className="mt-3 border-l-4 border-brand bg-brand-soft p-3 leading-relaxed">
                  <p className="mb-1 text-xs text-stone-600">運営からの返信・{formatDateTime(r.at)}</p>
                  <p className="whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
              {refund?.kind === "declined" && refund.note && (
                <div className="mt-3 border-l-4 border-stone-400 bg-stone-50 p-3 leading-relaxed">
                  <p className="mb-1 text-xs text-stone-600">運営から・{formatDateTime(refund.at)}</p>
                  <p className="whitespace-pre-wrap">{refund.note}</p>
                </div>
              )}
              {refund?.kind === "refunded" && <p className="mt-3 text-xs text-emerald-800">返金の手続きをしました（{formatDateTime(refund.at)}）。お支払い方法によって、反映まで数日かかることがあります。</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
