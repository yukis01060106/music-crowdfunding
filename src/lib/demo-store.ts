"use client";

import { useSyncExternalStore } from "react";

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
}

export interface MembershipSub {
  artistId: string;
  planId: string;
  joinedAt: string;
  /** 解約を申し込んだ日。次の更新日まで特典は使える */
  canceledAt?: string;
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

function read(): DemoState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<DemoState>) } : INITIAL_STATE;
  } catch {
    cache = INITIAL_STATE;
  }
  return cache;
}

function write(next: DemoState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
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
  update((s) => ({ ...s, backings: [{ ...b, id: newId(), backedAt: new Date().toISOString() }, ...s.backings] }));
}

export function joinMembership(artistId: string, planId: string) {
  update((s) => ({
    ...s,
    // 同じアーティストのプランを変えた場合は、加入日をそのままにプランだけ差し替える
    memberships: s.memberships.some((m) => m.artistId === artistId)
      ? s.memberships.map((m) => (m.artistId === artistId ? { ...m, planId, canceledAt: undefined } : m))
      : [...s.memberships, { artistId, planId, joinedAt: new Date().toISOString() }],
  }));
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
  update((st) => ({ ...st, submissions: [{ ...s, id: newId(), submittedAt: new Date().toISOString().slice(0, 10) }, ...st.submissions] }));
}

/** 退会・デモのリセット。保存内容をすべて消して最初の状態に戻す */
export function resetDemo() {
  write({ ...INITIAL_STATE });
}
