"use client";

import { useDemo } from "@/lib/demo-store";
import { useActiveBackings } from "@/lib/backing-state";
import { useNow } from "@/lib/use-now";
import type { AdminUser, InboxItem, RefundRequest } from "./admin-data";

/**
 * 運営の画面に、このブラウザの支援者からの連絡（お問い合わせ・通報・返金の相談）を足す。
 * デモでは同じブラウザに保存しているので、支援者の画面で送ったものが、そのまま運営の画面に届く。
 * TODO（本番）: Supabase の inquiries テーブルから、運営ロールだけが読む。返金の相談の金額と決済の状態は、
 *   クライアントが送った値ではなく、支援の記録（Stripe の PaymentIntent）から取る
 */
export function useLiveInbox(base: InboxItem[]): InboxItem[] {
  const { inquiries, user } = useDemo();
  const mine: InboxItem[] = inquiries
    .filter((i) => i.kind !== "refund")
    .map((i) => ({
      id: i.id,
      kind: i.kind === "report" ? "report" : "inquiry",
      from: i.fromName || user?.name || "ゲスト",
      subject: i.subject,
      body: i.fromEmail ? `${i.body}\n\n（返信先：${i.fromEmail}）` : i.body,
      target: i.target,
      targetSlug: i.targetSlug,
      receivedAt: i.receivedAt,
      status: "open",
    }));
  return [...mine, ...base];
}

export function useLiveRefunds(base: RefundRequest[]): RefundRequest[] {
  const { inquiries, user, backings } = useDemo();
  const mine: RefundRequest[] = inquiries
    .filter((i) => i.kind === "refund")
    .map((i) => ({
      id: i.id,
      user: user?.name ?? "ゲスト",
      project: i.target ?? "",
      amount: i.amount ?? 0,
      requestedAt: i.receivedAt,
      reason: i.body,
      cause: i.cause ?? "supporter",
      // 対象の支援の記録から、決済の状態を出す（請求前のものは「返金」ではなく「取り消し」になる）
      paymentState: backings.find((b) => b.id === i.backingId)?.charged === false ? "uncharged" : "charged",
    }));
  return [...mine, ...base];
}

/** ユーザーの一覧に、このブラウザでログインしている人を足す */
export function useLiveUsers(base: AdminUser[]): AdminUser[] {
  const { user, backings: all } = useDemo();
  // 返金・期限切れを除いた、有効な支援で累計を出す
  const backings = useActiveBackings(useNow());
  if (!user) return base;
  const me: AdminUser = {
    id: "me",
    name: user.name,
    email: user.email,
    role: "supporter",
    verified: false,
    // 登録日は、いちばん古い支援の日を目安にする（デモではアカウントの作成日を持たないため）
    joinedAt: [...all].sort((a, b) => Date.parse(a.backedAt) - Date.parse(b.backedAt))[0]?.backedAt ?? new Date().toISOString(),
    backed: backings.reduce((s, b) => s + b.amount, 0),
    status: "active",
  };
  return [me, ...base];
}
