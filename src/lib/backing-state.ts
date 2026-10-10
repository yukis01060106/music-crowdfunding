"use client";

import type { Project } from "@/types";
import { own, useDemo, type Backing } from "./demo-store";
import { useAdmin } from "./admin-store";

/**
 * 支援の状態を1か所で決める。支援者・実行者・運営の画面は、すべてここを通して数える
 * （画面ごとに数え方が違うと、金額や件数が合わなくなるため）
 */

/** 最初から入っている見本の支援（公開ページの数字にもう含まれているので、実行者の画面で「新しい支援」として足さない） */
export const isSeedBacking = (b: Backing) => b.id === "bk-1" || b.id === "bk-2";

/** コンビニ払いで、支払期限を過ぎたもの（Webhook がないので、画面で期限から判断する） */
export const voucherExpired = (b: Backing, now: number | null) => Boolean(b.awaitingPayment && b.voucherExpiresAt && now !== null && now > Date.parse(b.voucherExpiresAt));

export type PaymentState = "free" | "failed" | "expired" | "awaiting" | "charged" | "pending";

/** 決済の状態。charged（決済済み）のものだけが、返金の対象になる */
export function paymentState(project: Pick<Project, "fundingModel" | "status">, b: Backing, now: number | null): PaymentState {
  if (b.amount === 0) return "free";
  // 目標に届かなかった All-or-Nothing は、登録したカードにも請求しない
  if (project.status === "failed" && project.fundingModel === "all_or_nothing") return "failed";
  if (voucherExpired(b, now)) return "expired";
  if (b.awaitingPayment) return "awaiting";
  if (b.stripeSessionId) return b.charged === false ? "pending" : "charged";
  if (project.fundingModel === "all_in" || project.status === "succeeded") return "charged";
  return "pending";
}

export const PAYMENT_LABELS: Record<PaymentState, { label: string; className: string }> = {
  free: { label: "参加済み（0円）", className: "bg-brand-soft text-brand" },
  failed: { label: "決済なし（目標未達）", className: "bg-stone-100 text-stone-600" },
  expired: { label: "お支払い期限切れ（無効）", className: "bg-stone-100 text-stone-600" },
  awaiting: { label: "お支払い待ち（コンビニ）", className: "bg-amber-100 text-amber-800" },
  charged: { label: "決済済み", className: "bg-emerald-100 text-emerald-700" },
  pending: { label: "決済予定（目標達成後）", className: "bg-amber-100 text-amber-800" },
};

/** 運営が返金した支援の ID */
export function useRefundedBackingIds(): Set<string> {
  const { inquiries } = useDemo();
  const { refunds } = useAdmin();
  return new Set(inquiries.filter((i) => i.kind === "refund" && i.backingId && own(refunds, i.id)?.kind === "refunded").map((i) => i.backingId!));
}

/** 有効な支援（返金したもの・コンビニ払いの期限切れを除く）。実行者の数字・一覧・発送、運営の累計はこれで数える */
export function useActiveBackings(now: number | null): Backing[] {
  const { backings } = useDemo();
  const refunded = useRefundedBackingIds();
  return backings.filter((b) => !refunded.has(b.id) && !voucherExpired(b, now));
}

/* ───── 実行者の画面で使う数え方 ───── */

/** このブラウザで支援した分（見本を除く）。refunded は運営が返金したもの */
export function useNewBackings(slug: string, now: number | null): (Backing & { refunded: boolean })[] {
  const { backings } = useDemo();
  const refunded = useRefundedBackingIds();
  return backings
    .filter((b) => b.projectSlug === slug && !isSeedBacking(b) && !voucherExpired(b, now))
    .map((b) => ({ ...b, refunded: refunded.has(b.id) }));
}

/** 見本の数字に、このブラウザの有効な支援（返金を除く）を足したプロジェクトの数字。達成率は公開ページと同じ式（progressPercent） */
export function liveTotals<P extends Pick<Project, "raised" | "backers" | "goal" | "goalType">>(project: P, added: Backing[]): P {
  return { ...project, raised: project.raised + added.reduce((s, b) => s + b.amount, 0), backers: project.backers + added.length };
}

/** いま終了したときの受け取りの対象額。All-or-Nothing で目標に届いていなければ 0 */
export function payableRaised(project: Pick<Project, "raised" | "fundingModel">, percent: number): number {
  return project.fundingModel === "all_or_nothing" && percent < 100 ? 0 : project.raised;
}

/**
 * 目標を達成した場合の受け取り額の目安。達成するには支援総額が目標以上になるので、目標額を下限にする
 * （参加人数が目標のときは、今の支援額で出す）
 */
export function payoutIfReached(project: Pick<Project, "raised" | "goal" | "goalType">, payout: (n: number) => number): number {
  return payout(project.goalType === "amount" ? Math.max(project.raised, project.goal) : project.raised);
}

/* ───── 運営からの知らせの未読 ───── */

/** 支援者への運営からの知らせ（返信・返金の結果）の数と、まだ読んでいない数 */
export function useOperatorNotices(): { totals: Record<string, number>; unread: number } {
  const { inquiries, seenOperator, backings } = useDemo();
  const admin = useAdmin();
  const totals: Record<string, number> = {};
  for (const i of inquiries) totals[i.id] = (own(admin.inboxReplies, i.id)?.length ?? 0) + (own(admin.refunds, i.id) ? 1 : 0);
  // 支援したプロジェクトの掲載停止のお知らせも、1件の知らせとして数える
  for (const slug of new Set(backings.map((b) => b.projectSlug))) if (own(admin.suspendedProjects, slug)) totals[`suspend:${slug}`] = 1;
  const unread = Object.entries(totals).reduce((n, [id, total]) => n + Math.max(0, total - (own(seenOperator, id) ?? 0)), 0);
  return { totals, unread };
}
