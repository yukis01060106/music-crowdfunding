"use client";

import { useSyncExternalStore } from "react";
import { jstDateKey } from "./format";

// デモ用の保存領域。ログイン・お気に入り・支援・メンバーシップ・メッセージ・設定を
// ブラウザ（localStorage）に保存して、サイト全体でつながって見えるようにする。
// TODO: Supabase を入れたら、この中身を Supabase Auth とテーブルへの読み書きに置き換える。
//       画面側は useDemo() と各アクション関数だけを使っているので、差し替えはこのファイルで済む。

export interface DemoUser {
  name: string;
  email: string;
  /** ログイン方法（表示用） */
  provider: "email" | "google" | "x";
}

export interface Backing {
  id: string;
  projectSlug: string;
  rewardId: string;
  quantity: number;
  tip: number;
  amount: number;
  backedAt: string;
  paymentMethod: string;
  comment?: string;
  /** Stripe で決済したときの Checkout Session の ID（テストモード・本番） */
  stripeSessionId?: string;
  /** All-or-Nothing で、登録したカードにまだ請求していないとき false */
  charged?: boolean;
  /** コンビニ払いで、お店での支払いを待っているとき true */
  awaitingPayment?: boolean;
  /** コンビニ払いの払込票のページと支払期限 */
  voucherUrl?: string;
  voucherExpiresAt?: string;
}

export interface MembershipSub {
  artistId: string;
  planId: string;
  joinedAt: string;
  /** 解約を申し込んだ日。次の更新日まで特典は使える */
  canceledAt?: string;
  /** 下位プランへの変更を申し込んだとき、次の更新日から切り替わるプラン */
  pendingPlanId?: string;
  /** Stripe で加入したときの Checkout Session の ID。解約・変更のときに本人の確認に使う */
  stripeSessionId?: string;
}

export interface ThreadMessage {
  from: "me" | "artist";
  body: string;
  at: string;
}

export interface Thread {
  id: string;
  projectSlug: string;
  subject: string;
  messages: ThreadMessage[];
  /** アーティストからの未読がある */
  unread: boolean;
}

export interface Address {
  id: string;
  name: string;
  postalCode: string;
  address: string;
  phone: string;
}

export interface DemoSettings {
  notifyUpdates: boolean;
  notifyEnding: boolean;
  notifyNews: boolean;
  notifyFes: boolean;
  addresses: Address[];
}

/** 実行者が審査に提出したプロジェクト。運営の審査キューに並ぶ */
export interface Submission {
  id: string;
  title: string;
  artist: string;
  submittedAt: string;
  goal: string;
  story: string;
  rewards: string[];
  flags: { identity: boolean; cover: boolean; minor: boolean };
}

export interface DemoState {
  user: DemoUser | null;
  favorites: string[];
  backings: Backing[];
  memberships: MembershipSub[];
  threads: Thread[];
  settings: DemoSettings;
  submissions: Submission[];
}

const KEY = "otofund:demo";

/** 初めて開いた人にも中身が見えるよう、支援やメンバーシップを少し入れておく */
export const INITIAL_STATE: DemoState = {
  user: null,
  favorites: ["mio-aoki-live-album"],
  backings: [
    { id: "bk-1", projectSlug: "hoshizora-1st-album", rewardId: "r-cd", quantity: 1, tip: 0, amount: 4000, backedAt: "2026-09-03T12:10:00+09:00", paymentMethod: "クレジットカード" },
    { id: "bk-2", projectSlug: "neon-kaiju-1000", rewardId: "r-ticket", quantity: 1, tip: 500, amount: 4000, backedAt: "2026-09-18T09:30:00+09:00", paymentMethod: "PayPay" },
  ],
  memberships: [
    { artistId: "hoshizora-radio", planId: "m-crew", joinedAt: "2026-04-12T20:00:00+09:00" },
    { artistId: "yumenoa", planId: "m-listener", joinedAt: "2026-08-30T22:10:00+09:00" },
  ],
  threads: [
    {
      id: "th-1",
      projectSlug: "hoshizora-1st-album",
      subject: "サインの宛名について",
      unread: true,
      messages: [
        { from: "me", body: "サインに名前を入れてもらうことはできますか？", at: "2026-09-20T19:05:00+09:00" },
        { from: "artist", body: "もちろんです！発送前にお名前の確認フォームをお送りしますね。", at: "2026-09-21T10:30:00+09:00" },
      ],
    },
  ],
  settings: { notifyUpdates: true, notifyEnding: true, notifyNews: false, notifyFes: true, addresses: [] },
  submissions: [],
};

let cache: DemoState | null = null;
const listeners = new Set<() => void>();

/** 保存する形の版。形を変えたら上げて、古い値は捨てる */
const VERSION = 1;

/**
 * 保存された値を検証して、形の合わない項目は初期値に戻す（古い版の値や、手で書き換えられた値で画面が落ちないように）。
 * 注意：ここの値はブラウザで自由に書き換えられる。本番では、金額・支援の有無・ログイン中のユーザーを必ずサーバーで確かめる。
 */
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown) => isStr(v) && !Number.isNaN(Date.parse(v));
const isBacking = (x: Record<string, unknown>) =>
  isStr(x.id) && isStr(x.projectSlug) && isStr(x.rewardId) && Number.isFinite(x.amount) && Number.isInteger(x.quantity) && Number.isFinite(x.tip) && isStr(x.paymentMethod) && isDate(x.backedAt);
const isMembership = (x: Record<string, unknown>) => isStr(x.artistId) && isStr(x.planId) && isDate(x.joinedAt) && (x.canceledAt === undefined || isDate(x.canceledAt));
const isAddress = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.name) && isStr(x.postalCode) && isStr(x.address) && isStr(x.phone);
const isSubmission = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.title) && isStr(x.artist) && isDate(x.submittedAt) && isStr(x.goal) && isStr(x.story) && Array.isArray(x.rewards) && x.rewards.every(isStr) && !!x.flags && typeof x.flags === "object";
const isThread = (x: Record<string, unknown>) => isStr(x.id) && isStr(x.projectSlug) && isStr(x.subject) && Array.isArray(x.messages);

function sanitize(raw: unknown): DemoState {
  if (!raw || typeof raw !== "object" || (raw as { v?: unknown }).v !== VERSION) return INITIAL_STATE;
  const r = raw as Partial<DemoState>;
  // 配列の中身も、形の正しい項目だけ残す
  const arr = <T,>(v: unknown, fallback: T[], valid: (x: Record<string, unknown>) => boolean = () => true): T[] =>
    Array.isArray(v) ? (v.filter((x) => x && typeof x === "object" && valid(x as Record<string, unknown>)) as T[]) : fallback;
  const user = r.user && typeof r.user === "object" && typeof r.user.name === "string" && typeof r.user.email === "string" ? r.user : null;
  const settings = r.settings && typeof r.settings === "object" ? { ...INITIAL_STATE.settings, ...r.settings, addresses: arr(r.settings.addresses, [], isAddress) } : INITIAL_STATE.settings;
  return {
    user,
    favorites: Array.isArray(r.favorites) ? r.favorites.filter((f): f is string => typeof f === "string") : INITIAL_STATE.favorites,
    backings: arr(r.backings, INITIAL_STATE.backings, isBacking),
    memberships: arr(r.memberships, INITIAL_STATE.memberships, isMembership),
    threads: arr<Thread>(r.threads, INITIAL_STATE.threads, isThread).map((t) => ({ ...t, messages: arr(t.messages, [], (m) => isStr(m.body) && isDate(m.at) && (m.from === "me" || m.from === "artist")) })),
    settings,
    submissions: arr(r.submissions, [], isSubmission),
  };
}

function read(): DemoState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : INITIAL_STATE;
  } catch {
    cache = INITIAL_STATE;
  }
  return cache;
}

function write(next: DemoState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...next, v: VERSION }));
  } catch {
    // 保存できない環境（プライベートブラウズなど）では、開いている間だけ覚えておく
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

/** 保存された状態。サーバー描画時と最初の描画は INITIAL_STATE（ログアウト状態） */
export function useDemo(): DemoState {
  return useSyncExternalStore(subscribe, read, () => INITIAL_STATE);
}

/** ブラウザで描画されたか。ログイン状態に依存する表示のちらつきを防ぐ */
const noop = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

function update(fn: (s: DemoState) => DemoState) {
  write(fn(read()));
}

export const newId = () => Math.random().toString(36).slice(2, 10);

/* ───── アクション ───── */

export function login(user: DemoUser) {
  update((s) => ({ ...s, user }));
}

export function logout() {
  update((s) => ({ ...s, user: null }));
}

export function updateProfile(patch: Partial<DemoUser>) {
  update((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
}

export function toggleFavorite(slug: string) {
  update((s) => ({
    ...s,
    favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug],
  }));
}

export function addBacking(b: Omit<Backing, "id" | "backedAt">) {
  update((s) => {
    // 決済画面から戻ってページを開き直しても、同じ支援を二重に記録しない
    if (b.stripeSessionId && s.backings.some((x) => x.stripeSessionId === b.stripeSessionId)) return s;
    return { ...s, backings: [{ ...b, id: newId(), backedAt: new Date().toISOString() }, ...s.backings] };
  });
}

export function markCharged(stripeSessionId: string) {
  update((s) => ({ ...s, backings: s.backings.map((b) => (b.stripeSessionId === stripeSessionId ? { ...b, charged: true } : b)) }));
}

/**
 * 加入、またはプランの変更。上位への変更はすぐ切り替え、下位への変更は次の更新日から（pendingPlanId に入れておく）。
 * 加入日（＝毎月の更新日）は変えない。
 */
export function joinMembership(artistId: string, planId: string, change: "new" | "upgrade" | "downgrade" = "new", stripeSessionId?: string) {
  update((s) => {
    const existing = s.memberships.find((m) => m.artistId === artistId);
    // 同じ決済から戻ってきたときは、記録し直さない
    if (stripeSessionId && existing?.stripeSessionId === stripeSessionId) return s;
    const fresh: MembershipSub = { artistId, planId, joinedAt: new Date().toISOString(), stripeSessionId };
    if (!existing) return { ...s, memberships: [...s.memberships, fresh] };
    // 終了したメンバーシップに入り直すときは、今日を新しい加入日（＝更新日）にする
    if (change === "new") return { ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? fresh : m)) };
    const next: MembershipSub =
      change === "downgrade"
        ? { ...existing, canceledAt: undefined, pendingPlanId: planId === existing.planId ? undefined : planId }
        : { ...existing, planId, canceledAt: undefined, pendingPlanId: undefined };
    return { ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? next : m)) };
  });
}

export function cancelMembership(artistId: string) {
  update((s) => ({ ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? { ...m, canceledAt: new Date().toISOString() } : m)) }));
}

export function resumeMembership(artistId: string) {
  update((s) => ({ ...s, memberships: s.memberships.map((m) => (m.artistId === artistId ? { ...m, canceledAt: undefined } : m)) }));
}

export function sendMessage(projectSlug: string, body: string, subject?: string) {
  const at = new Date().toISOString();
  update((s) => {
    const existing = s.threads.find((t) => t.projectSlug === projectSlug && (!subject || t.subject === subject));
    if (existing) {
      return { ...s, threads: s.threads.map((t) => (t.id === existing.id ? { ...t, messages: [...t.messages, { from: "me", body, at }] } : t)) };
    }
    const thread: Thread = { id: newId(), projectSlug, subject: subject || "プロジェクトについて", unread: false, messages: [{ from: "me", body, at }] };
    return { ...s, threads: [thread, ...s.threads] };
  });
}

export function markThreadRead(id: string) {
  update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === id ? { ...t, unread: false } : t)) }));
}

export function updateSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function submitProject(s: Omit<Submission, "id" | "submittedAt">) {
  update((st) => ({ ...st, submissions: [{ ...s, id: newId(), submittedAt: jstDateKey() }, ...st.submissions] }));
}

/** 退会・デモのリセット。保存内容をすべて消して最初の状態に戻す */
export function resetDemo() {
  write({ ...INITIAL_STATE });
}
