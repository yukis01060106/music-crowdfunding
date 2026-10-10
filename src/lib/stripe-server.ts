// Stripe をサーバーだけで使うための共通処理。API ルート（*.server.ts）からだけ読み込む。
// シークレットキーはここ以外で読まない。ブラウザには出さない。
import Stripe from "stripe";
import { getArtist, getProject } from "@/lib/data";
import { isPlanFull } from "@/lib/membership";
import { SITE_NAME } from "@/lib/site";
import { stripeModeFor } from "@/lib/stripe-mode";
import { TIP_OPTIONS } from "@/lib/support-options";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

// ブラウザ向けのコードに紛れ込んだら、すぐ気づけるよう止める（シークレットキーを扱うため）
if (typeof window !== "undefined") throw new Error("stripe-server はサーバー専用です");

export { TIP_OPTIONS };

let client: Stripe | null = null;

const mode = () => stripeModeFor(process.env.STRIPE_SECRET_KEY, process.env.STRIPE_ALLOW_LIVE);

/** 使える Stripe。キーがない・本番キーで許可がないときは null（決済しない） */
export function stripe(): Stripe | null {
  if (!mode()) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  return client;
}

/** テストモードか。テスト用の機能（後から請求する操作など）は、テストモードでだけ使わせる */
export const isTestMode = () => mode() === "test";

/** 決済の画面づくり・契約の変更を、連打や自動での大量の呼び出しから守る（1つの送り元につき1分10回、全体で120回） */
const limited = createRateLimiter({ perKey: 10, global: 120 });
export function checkRate(request: Request): Response | null {
  return limited(clientKey(request)) ? json({ error: "短い時間に何度も操作しています。1分ほど待ってからお試しください。" }, 429) : null;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

/**
 * 公開している URL（環境変数 NEXT_PUBLIC_SITE_URL）。リクエストの Host ヘッダーは偽れるので、
 * 決済から戻る先や送り元の確認には、これを使う。開発中で未設定のときだけ、リクエストから作る
 */
const configuredSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || null;

/** 自サイトの画面からの呼び出しだけを受け付ける */
export function checkOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const site = configuredSiteUrl();
  const allowed = site ? new URL(site).origin : new URL(request.url).origin;
  if (origin && origin !== allowed) return json({ error: "この送り元からは利用できません。" }, 403);
  return null;
}

/** 決済から戻ってくる URL の土台（basePath を含む） */
export function siteBase(request: Request): string {
  return configuredSiteUrl() ?? `${new URL(request.url).origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;
}

export async function readBody<T>(request: Request, maxBytes = 10_000): Promise<Partial<T> | null> {
  // JSON 以外の送り方（事前確認のいらないフォーム送信など）と、大きすぎる本文は読む前に断る
  if (!request.headers.get("content-type")?.startsWith("application/json")) return null;
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null;
  const text = await request.text().catch(() => "");
  if (!text || text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" ? (v as Partial<T>) : null;
  } catch {
    return null;
  }
}

export interface SupportOrder {
  projectSlug: string;
  projectTitle: string;
  fundingModel: "all_or_nothing" | "all_in";
  rewardId: string;
  rewardTitle: string;
  unitPrice: number;
  quantity: number;
  tip: number;
  amount: number;
}

/**
 * 支援の内容を、サーバーのデータから組み立て直す。金額はブラウザから受け取らず、リターンの価格から計算する。
 * 受け付けられない内容なら、理由の文字列を返す。
 */
export async function buildSupportOrder(input: { projectSlug?: unknown; rewardId?: unknown; quantity?: unknown; tip?: unknown }, now = Date.now()): Promise<SupportOrder | string> {
  if (typeof input.projectSlug !== "string" || typeof input.rewardId !== "string") return "支援の内容が正しくありません。";
  const project = await getProject(input.projectSlug);
  if (!project) return "プロジェクトが見つかりません。";
  if (project.status !== "live" || new Date(project.endAt).getTime() <= now) return "このプロジェクトの募集は終了しました。";
  const reward = project.rewards.find((r) => r.id === input.rewardId);
  if (!reward) return "リターンが見つかりません。";
  if (reward.limit !== undefined && reward.backers >= reward.limit) return "このリターンは受付を終了しました。";
  if (reward.price === 0) return "0円のプランは決済なしで参加できます。";
  const maxQuantity = reward.limit !== undefined ? 1 : 10;
  const quantity = Number.isInteger(input.quantity) && (input.quantity as number) >= 1 ? Math.min(input.quantity as number, maxQuantity) : 1;
  const tip = TIP_OPTIONS.includes(input.tip as number) ? (input.tip as number) : 0;
  return {
    projectSlug: project.slug,
    projectTitle: project.title,
    fundingModel: project.fundingModel,
    rewardId: reward.id,
    rewardTitle: reward.title,
    unitPrice: reward.price,
    quantity,
    tip,
    amount: reward.price * quantity + tip,
  };
}

export interface MembershipOrder {
  artistId: string;
  artistName: string;
  planId: string;
  planName: string;
  price: number;
}

export async function buildMembershipOrder(input: { artistId?: unknown; planId?: unknown }): Promise<MembershipOrder | string> {
  if (typeof input.artistId !== "string" || typeof input.planId !== "string") return "加入の内容が正しくありません。";
  const artist = await getArtist(input.artistId);
  const plan = artist?.membership?.plans.find((p) => p.id === input.planId);
  if (!artist || !plan) return "プランが見つかりません。";
  if (isPlanFull(plan)) return "このプランは満員です。";
  return { artistId: artist.id, artistName: artist.name, planId: plan.id, planName: plan.name, price: plan.price };
}

/** 月額プランの Price。プラン変更のときに使う（Checkout の中では price_data で同じものを作る） */
export function membershipProductName(order: MembershipOrder): string {
  return `${order.artistName} メンバーシップ（${order.planName}）｜${SITE_NAME}`;
}

const DECLINE_MESSAGES: Record<string, string> = {
  insufficient_funds: "カードの残高が足りませんでした。別のカードをお試しください。",
  expired_card: "カードの有効期限が切れています。別のカードをお試しください。",
  incorrect_cvc: "セキュリティコードが正しくありません。",
  card_declined: "カードで決済できませんでした。別のカードをお試しください。",
  authentication_required: "カードの本人認証が必要です。",
};

/** Stripe のエラーを、画面に出せる日本語の短い文にする。設定の不備や内部の情報は画面に出さず、ログにだけ残す */
export function stripeErrorMessage(e: unknown): string {
  if (e instanceof Stripe.errors.StripeCardError) {
    return DECLINE_MESSAGES[e.decline_code ?? ""] ?? DECLINE_MESSAGES[e.code ?? ""] ?? DECLINE_MESSAGES.card_declined;
  }
  console.error("[stripe]", e instanceof Error ? `${e.name}: ${e.message}` : e);
  return "決済サービスとの通信でエラーが起きました。時間をおいてお試しください。";
}
