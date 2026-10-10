"use client";

import { assetPath } from "@/lib/asset-path";

// 決済（Stripe Checkout）をブラウザから呼ぶための小さな関数。
// キーはサーバーだけが持つ。ブラウザは「決済画面の URL を作って」と頼み、戻ってきたら「完了したか確かめて」と頼むだけ。

/** "test" | "live" | ""。空ならデモ（決済しない） */
export const STRIPE_MODE = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "";
export const STRIPE_ENABLED = STRIPE_MODE !== "";
export const STRIPE_TEST = STRIPE_MODE === "test";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(assetPath(path), { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? "決済サービスとの通信でエラーが起きました。");
  return data;
}

/** 決済画面を作って、その URL へ移動する */
export async function startCheckout(path: "/api/checkout/support/" | "/api/checkout/membership/", body: Record<string, unknown>) {
  const { url } = await call<{ url: string }>(path, { method: "POST", body: JSON.stringify(body) });
  window.location.assign(url);
}

export interface SupportResult {
  kind: "support";
  sessionId: string;
  projectSlug: string;
  rewardId: string;
  quantity: number;
  tip: number;
  amount: number;
  charged: boolean;
  awaitingPayment: boolean;
  paymentMethod: string;
  /** コンビニ払いの払込票のページ。支払番号と払い方が載っている */
  voucherUrl: string | null;
  voucherExpiresAt: string | null;
}

export interface MembershipResult {
  kind: "membership";
  sessionId: string;
  artistId: string;
  planId: string;
  subscriptionId: string | null;
}

/** 決済画面から戻ってきたときに、サーバーで完了を確かめる */
export function confirmCheckout(sessionId: string) {
  return call<SupportResult | MembershipResult>(`/api/checkout/session/?id=${encodeURIComponent(sessionId)}`);
}

/** テストモード：All-or-Nothing の支援に、目標達成として請求する */
export function chargeBacking(sessionId: string) {
  return call<{ status: string; charged: boolean }>("/api/checkout/charge/", { method: "POST", body: JSON.stringify({ sessionId }) });
}

export function updateMembership(sessionId: string, action: "cancel" | "resume" | "upgrade", planId?: string) {
  return call<{ status: string }>("/api/membership/update/", { method: "POST", body: JSON.stringify({ sessionId, action, planId }) });
}

/** コンビニ払いの払込票の URL。保存された値をそのままリンクにしないよう、https のものだけ使う */
export function safeVoucherUrl(url: string | null | undefined): string | null {
  return url && /^https:\/\//.test(url) ? url : null;
}
