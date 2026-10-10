"use client";

import { useSyncExternalStore } from "react";

/**
 * 運営画面のデモ用の保存先（このブラウザの localStorage）。
 * 掲載の停止・返金・本人確認などの操作と、その記録（監査ログ）を残し、再読み込みしても続きから使えるようにする。
 * TODO（本番）: Supabase のテーブル（admin_actions / admin_audit_logs）に置き換える。操作はサーバーで権限を確かめてから記録する
 *   - operator と at はサーバーがセッションの運営者と now() で決め、クライアントから受け取らない
 *   - 状態の更新と admin_audit_logs への追記は、同じトランザクション（RPC など）で行う（片方だけ残らないように）
 *   - admin_audit_logs には UPDATE と DELETE の権限を付けない（追記だけ）
 *   - 「デモを最初の状態に戻す」は本番に持ち込まない（NEXT_PUBLIC_DEMO で出し分け済み）
 *   - ID やスラッグは利用者が決めることがあるので、Object.hasOwn か Map で読む（constructor などのキーに当たらないように）
 */

export type AuditAction =
  | "project_suspend"
  | "project_resume"
  | "user_suspend"
  | "user_resume"
  | "identity_approve"
  | "identity_resubmit"
  | "refund"
  | "refund_decline"
  | "failure_notify"
  | "inbox_reply"
  | "inbox_progress"
  | "review_approve"
  | "review_reject"
  | "payout_release"
  | "payout_paid"
  | "fes_rate";

export const AUDIT_LABELS: Record<AuditAction, { label: string; group: "project" | "user" | "money" | "inbox" | "review" | "fes" }> = {
  project_suspend: { label: "掲載を停止", group: "project" },
  project_resume: { label: "掲載を再開", group: "project" },
  user_suspend: { label: "利用を停止", group: "user" },
  user_resume: { label: "利用を再開", group: "user" },
  identity_approve: { label: "本人確認を承認", group: "user" },
  identity_resubmit: { label: "書類の出し直しを依頼", group: "user" },
  refund: { label: "返金を実行", group: "money" },
  refund_decline: { label: "返金をお断り", group: "money" },
  failure_notify: { label: "カードの更新を依頼", group: "money" },
  payout_release: { label: "振込の保留を解除", group: "money" },
  payout_paid: { label: "振込済みに変更", group: "money" },
  inbox_reply: { label: "問い合わせに返信", group: "inbox" },
  inbox_progress: { label: "対応中に変更", group: "inbox" },
  review_approve: { label: "審査で承認", group: "review" },
  review_reject: { label: "審査で差し戻し", group: "review" },
  fes_rate: { label: "FES の割合を試算", group: "fes" },
};

export interface AuditEntry {
  id: string;
  at: string;
  /** 操作した人。本番ではログイン中の運営者 */
  operator: string;
  action: AuditAction;
  target: string;
  detail?: string;
}

export type RefundResult = { kind: "refunded" | "declined"; at: string; note?: string };
export type InboxStatus = "open" | "in_progress" | "done";
export type PayoutStatus = "scheduled" | "paid" | "on_hold";
export type ReviewDecision = { decision: "approved" | "rejected"; note?: string; at: string };

export interface AdminState {
  suspendedProjects: Record<string, string>;
  userStatus: Record<string, "active" | "suspended">;
  verified: Record<string, boolean>;
  resubmit: Record<string, boolean>;
  refunds: Record<string, RefundResult>;
  notified: Record<string, boolean>;
  inboxStatus: Record<string, InboxStatus>;
  inboxReplies: Record<string, { body: string; at: string }[]>;
  payoutStatus: Record<string, PayoutStatus>;
  /** 振込済みにした日時（振込日の実績） */
  payoutPaidAt: Record<string, string>;
  reviewDecisions: Record<string, ReviewDecision>;
  fesRate: number;
  log: AuditEntry[];
}

const KEY = "otofund:admin";
const VERSION = 1;
const OPERATOR = "運営（デモ）";
const LOG_LIMIT = 300;

export const ADMIN_INITIAL: AdminState = {
  suspendedProjects: {},
  userStatus: {},
  verified: {},
  resubmit: {},
  refunds: {},
  notified: {},
  inboxStatus: {},
  inboxReplies: {},
  payoutStatus: {},
  payoutPaidAt: {},
  reviewDecisions: {},
  fesRate: 0,
  log: [],
};

/* ───── 読み込みの検証（壊れた値や古い形は捨てる） ───── */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isOptStr = (v: unknown) => v === undefined || isStr(v);
/** 長すぎる文字列は切る（保存データを書き換えられても、表示や CSV が重くならないように） */
const MAX_TEXT = 2000;
const clip = (v: string) => v.slice(0, MAX_TEXT);
const isDate = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v));

function rec<T>(v: unknown, valid: (x: unknown) => boolean): Record<string, T> {
  if (!isObj(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, x]) => valid(x))) as Record<string, T>;
}

function sanitize(raw: unknown): AdminState {
  if (!isObj(raw) || raw.v !== VERSION) return ADMIN_INITIAL;
  const rate = typeof raw.fesRate === "number" && raw.fesRate >= 0 && raw.fesRate <= 50 ? Math.round(raw.fesRate) : 0;
  return {
    suspendedProjects: Object.fromEntries(Object.entries(rec<string>(raw.suspendedProjects, isStr)).map(([k, v]) => [k, clip(v)])),
    userStatus: rec(raw.userStatus, (x) => x === "active" || x === "suspended"),
    verified: rec(raw.verified, (x) => typeof x === "boolean"),
    resubmit: rec(raw.resubmit, (x) => typeof x === "boolean"),
    refunds: rec(raw.refunds, (x) => isObj(x) && (x.kind === "refunded" || x.kind === "declined") && isDate(x.at) && isOptStr(x.note)),
    notified: rec(raw.notified, (x) => typeof x === "boolean"),
    inboxStatus: rec(raw.inboxStatus, (x) => x === "open" || x === "in_progress" || x === "done"),
    inboxReplies: Object.fromEntries(
      Object.entries(rec<{ body: string; at: string }[]>(raw.inboxReplies, (x) => Array.isArray(x) && x.every((r) => isObj(r) && isStr(r.body) && isDate(r.at)))).map(([k, v]) => [
        k,
        v.slice(-50).map((r) => ({ body: clip(r.body), at: r.at })),
      ]),
    ),
    payoutStatus: rec(raw.payoutStatus, (x) => x === "scheduled" || x === "paid" || x === "on_hold"),
    payoutPaidAt: rec(raw.payoutPaidAt, isDate),
    reviewDecisions: rec(raw.reviewDecisions, (x) => isObj(x) && (x.decision === "approved" || x.decision === "rejected") && isDate(x.at) && isOptStr(x.note)),
    fesRate: rate,
    log: Array.isArray(raw.log)
      ? (raw.log.filter((e) => isObj(e) && isStr(e.id) && isDate(e.at) && isStr(e.action) && Object.hasOwn(AUDIT_LABELS, e.action) && isStr(e.target) && isStr(e.operator) && isOptStr(e.detail)) as AuditEntry[])
          .slice(0, LOG_LIMIT)
          .map((e) => ({ ...e, target: clip(e.target), detail: e.detail === undefined ? undefined : clip(e.detail) }))
      : [],
  };
}

/* ───── 保存と購読（demo-store と同じ仕組み） ───── */

let cache: AdminState | null = null;
const listeners = new Set<() => void>();

function read(): AdminState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : ADMIN_INITIAL;
  } catch {
    cache = ADMIN_INITIAL;
  }
  return cache;
}

function write(next: AdminState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...next, v: VERSION }));
  } catch {
    // 保存できない環境では、開いている間だけ覚えておく
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 運営画面の状態。サーバー描画時と最初の描画は ADMIN_INITIAL */
export function useAdmin(): AdminState {
  return useSyncExternalStore(subscribe, read, () => ADMIN_INITIAL);
}

/** 状態を書き換え、同時に操作の記録を残す */
function act(action: AuditAction, target: string, detail: string | undefined, fn: (s: AdminState) => AdminState) {
  const s = read();
  const entry: AuditEntry = { id: Math.random().toString(36).slice(2, 10), at: new Date().toISOString(), operator: OPERATOR, action, target: clip(target), detail: detail === undefined ? undefined : clip(detail) };
  write({ ...fn(s), log: [entry, ...s.log].slice(0, LOG_LIMIT) });
}

const without = <T,>(r: Record<string, T>, key: string) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== key)) as Record<string, T>;

/* ───── 操作 ───── */

export function suspendProject(slug: string, title: string, reason: string) {
  act("project_suspend", title, reason, (s) => ({ ...s, suspendedProjects: { ...s.suspendedProjects, [slug]: reason } }));
}
export function resumeProject(slug: string, title: string, note?: string) {
  act("project_resume", title, note, (s) => ({ ...s, suspendedProjects: without(s.suspendedProjects, slug) }));
}

export function suspendUser(id: string, name: string, reason: string) {
  act("user_suspend", name, reason, (s) => ({ ...s, userStatus: { ...s.userStatus, [id]: "suspended" } }));
}
export function resumeUser(id: string, name: string) {
  act("user_resume", name, undefined, (s) => ({ ...s, userStatus: { ...s.userStatus, [id]: "active" } }));
}
export function approveIdentity(id: string, name: string) {
  act("identity_approve", name, undefined, (s) => ({ ...s, verified: { ...s.verified, [id]: true }, resubmit: without(s.resubmit, id) }));
}
export function requestResubmit(id: string, name: string, reason: string) {
  act("identity_resubmit", name, reason, (s) => ({ ...s, resubmit: { ...s.resubmit, [id]: true } }));
}

export function settleRefund(id: string, target: string, kind: RefundResult["kind"], note?: string) {
  act(kind === "refunded" ? "refund" : "refund_decline", target, note, (s) => ({ ...s, refunds: { ...s.refunds, [id]: { kind, at: new Date().toISOString(), note } } }));
}
export function notifyFailure(id: string, target: string) {
  act("failure_notify", target, undefined, (s) => ({ ...s, notified: { ...s.notified, [id]: true } }));
}
/** 保留を解除して振込予定に戻す。何を確かめたかを記録に残す */
export function releasePayout(id: string, target: string, note: string) {
  act("payout_release", target, note, (s) => ({ ...s, payoutStatus: { ...s.payoutStatus, [id]: "scheduled" } }));
}
/** 振込済みにする。実際に振り込んだ日時を残す（本番は Stripe の Webhook で確定する） */
export function markPayoutPaid(id: string, target: string, note?: string) {
  const at = new Date().toISOString();
  act("payout_paid", target, note, (s) => ({ ...s, payoutStatus: { ...s.payoutStatus, [id]: "paid" }, payoutPaidAt: { ...s.payoutPaidAt, [id]: at } }));
}

/** target は「◯◯さん・件名（対象）」の形。だれの・どの件か、記録だけでわかるようにする */
export function replyInbox(id: string, target: string, body: string) {
  act("inbox_reply", target, body, (s) => ({
    ...s,
    inboxStatus: { ...s.inboxStatus, [id]: "done" },
    inboxReplies: { ...s.inboxReplies, [id]: [...(s.inboxReplies[id] ?? []), { body, at: new Date().toISOString() }] },
  }));
}
export function markInboxInProgress(id: string, target: string) {
  act("inbox_progress", target, undefined, (s) => ({ ...s, inboxStatus: { ...s.inboxStatus, [id]: "in_progress" } }));
}

export function decideReview(id: string, title: string, decision: ReviewDecision["decision"], note?: string) {
  act(decision === "approved" ? "review_approve" : "review_reject", title, note, (s) => ({
    ...s,
    reviewDecisions: { ...s.reviewDecisions, [id]: { decision, note, at: new Date().toISOString() } },
  }));
}

/** FES の割合の試算。動かすたびに記録すると多すぎるので、記録は確定（つまみを離す）ときだけ */
export function setFesRate(rate: number, record = false) {
  const s = read();
  if (!record) return write({ ...s, fesRate: rate });
  act("fes_rate", `${rate}%`, undefined, (x) => ({ ...x, fesRate: rate }));
}

/** デモの操作をすべて取り消し、最初の状態に戻す */
export function resetAdminDemo() {
  write(ADMIN_INITIAL);
}
