// 決済画面（Stripe Checkout）から戻ってきたときに、決済が本当に完了したかをサーバーで確かめる。
// ブラウザの URL にある session_id は誰でも書き換えられるので、内容は Stripe から取り直したものだけを返す。
// 個人情報（メールアドレスなど）は返さない（Session ID は URL や履歴から漏れうるため）。
// TODO: Supabase を入れたら、支援・加入の記録は Webhook（checkout.session.completed）で保存する
import type Stripe from "stripe";
import { checkOrigin, checkRate, json, stripe, stripeErrorMessage } from "@/lib/stripe-server";

const METHOD_LABELS: Record<string, string> = { card: "クレジットカード", konbini: "コンビニ払い", paypay: "PayPay" };

function methodLabel(pi: Stripe.PaymentIntent | string | null): string {
  if (!pi || typeof pi === "string") return "Stripe";
  const pm = pi.payment_method;
  const type = pm && typeof pm !== "string" ? pm.type : pi.payment_method_types?.[0];
  const wallet = pm && typeof pm !== "string" ? pm.card?.wallet?.type : undefined;
  if (wallet === "apple_pay" || wallet === "google_pay") return "Apple Pay / Google Pay";
  return (type && METHOD_LABELS[type]) || "Stripe";
}

export async function GET(request: Request) {
  const blocked = checkOrigin(request) ?? checkRate(request);
  if (blocked) return blocked;
  const s = stripe();
  if (!s) return json({ error: "決済の設定がまだです。" }, 503);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^cs_(test|live)_[\w]+$/.test(id)) return json({ error: "決済の情報が正しくありません。" }, 400);

  try {
    const session = await s.checkout.sessions.retrieve(id, { expand: ["payment_intent.payment_method"] });
    if (session.status !== "complete") return json({ error: "決済が完了していません。" }, 409);
    const m = session.metadata ?? {};

    if (m.kind === "support") {
      // コンビニ払い：払込票（支払番号）のページと、支払期限
      const pi = session.payment_intent && typeof session.payment_intent !== "string" ? session.payment_intent : null;
      const konbini = pi?.next_action?.konbini_display_details;
      return json({
        kind: "support",
        sessionId: session.id,
        projectSlug: m.projectSlug,
        rewardId: m.rewardId,
        quantity: Number(m.quantity),
        tip: Number(m.tip),
        amount: Number(m.amount),
        // All-or-Nothing は、カードを登録しただけで、まだ請求していない
        charged: session.mode === "payment" && session.payment_status === "paid",
        // コンビニ払いは、お店で払うまで「支払い待ち」
        awaitingPayment: session.mode === "payment" && session.payment_status === "unpaid",
        paymentMethod: session.mode === "setup" ? "クレジットカード" : methodLabel(session.payment_intent),
        voucherUrl: konbini?.hosted_voucher_url ?? null,
        voucherExpiresAt: konbini?.expires_at ? new Date(konbini.expires_at * 1000).toISOString() : null,
      });
    }
    if (m.kind === "membership") {
      return json({
        kind: "membership",
        sessionId: session.id,
        artistId: m.artistId,
        planId: m.planId,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null),
      });
    }
    return json({ error: "決済の情報が正しくありません。" }, 400);
  } catch (e) {
    return json({ error: stripeErrorMessage(e) }, 502);
  }
}
