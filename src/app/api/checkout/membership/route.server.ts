// メンバーシップ（月額）の決済画面（Stripe Checkout の subscription）を作る。
import { buildMembershipOrder, checkOrigin, checkRate, json, membershipProductName, readBody, siteBase, stripe, stripeErrorMessage } from "@/lib/stripe-server";

export async function POST(request: Request) {
  const blocked = checkOrigin(request) ?? checkRate(request);
  if (blocked) return blocked;
  const s = stripe();
  if (!s) return json({ error: "決済の設定がまだです（STRIPE_SECRET_KEY が未設定）。" }, 503);

  const body = await readBody<{ artistId: string; planId: string; email: string }>(request);
  if (!body) return json({ error: "加入の内容が正しくありません。" }, 400);
  const order = await buildMembershipOrder(body);
  if (typeof order === "string") return json({ error: order }, 400);

  const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ? body.email.slice(0, 200) : undefined;
  const back = `${siteBase(request)}/artists/${order.artistId}/join/`;
  const metadata = { kind: "membership", artistId: order.artistId, planId: order.planId };

  try {
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      locale: "ja",
      // 毎月の自動引き落としに使えるのはカード（Apple Pay / Google Pay を含む）だけ
      allowed_payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "jpy", product_data: { name: membershipProductName(order) }, unit_amount: order.price, recurring: { interval: "month" } }, quantity: 1 }],
      customer_email: email,
      metadata,
      subscription_data: { metadata },
      success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${back}?plan=${order.planId}&canceled=1`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: stripeErrorMessage(e) }, 502);
  }
}
