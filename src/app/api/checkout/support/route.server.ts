// 支援の決済画面（Stripe Checkout）を作る。
// - All-in：その場で決済（payment）
// - All-or-Nothing：カードを登録だけして、目標を達成したら請求（setup）。後で請求できるよう Customer にひも付ける
import { buildSupportOrder, checkOrigin, checkRate, json, readBody, siteBase, stripe, stripeErrorMessage } from "@/lib/stripe-server";

export async function POST(request: Request) {
  const blocked = checkOrigin(request) ?? checkRate(request);
  if (blocked) return blocked;
  const s = stripe();
  if (!s) return json({ error: "決済の設定がまだです（STRIPE_SECRET_KEY が未設定）。" }, 503);

  const body = await readBody<{ projectSlug: string; rewardId: string; quantity: number; tip: number; email: string }>(request);
  if (!body) return json({ error: "支援の内容が正しくありません。" }, 400);
  const order = await buildSupportOrder(body);
  if (typeof order === "string") return json({ error: order }, 400);

  const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ? body.email.slice(0, 200) : undefined;
  const back = `${siteBase(request)}/projects/${order.projectSlug}/support/`;
  // 戻ってきたときに、サーバーで同じ内容を確かめられるよう、決済に内容を記録しておく
  const metadata = {
    kind: "support",
    projectSlug: order.projectSlug,
    rewardId: order.rewardId,
    quantity: String(order.quantity),
    tip: String(order.tip),
    amount: String(order.amount),
    fundingModel: order.fundingModel,
  };

  try {
    if (order.fundingModel === "all_in") {
      const lineItems = [
        { price_data: { currency: "jpy", product_data: { name: `${order.rewardTitle}（${order.projectTitle}）` }, unit_amount: order.unitPrice }, quantity: order.quantity },
        ...(order.tip > 0 ? [{ price_data: { currency: "jpy", product_data: { name: "上乗せ支援" }, unit_amount: order.tip }, quantity: 1 }] : []),
      ];
      const session = await s.checkout.sessions.create({
        mode: "payment",
        locale: "ja",
        // 支援の画面で案内している方法だけ（ダッシュボードで有効にしたもののうち、この中にあるものが出る）
        allowed_payment_method_types: ["card", "konbini", "paypay"],
        line_items: lineItems,
        customer_email: email,
        metadata,
        payment_intent_data: { metadata },
        success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${back}?reward=${order.rewardId}&canceled=1`,
      });
      return json({ url: session.url });
    }

    // All-or-Nothing：後から請求できるのはカード（Apple Pay / Google Pay を含む）だけ
    // Customer は決済ページを開くたびではなく、登録が完了したときだけ作る（途中でやめた分が残らないように）
    const session = await s.checkout.sessions.create({
      mode: "setup",
      locale: "ja",
      currency: "jpy",
      allowed_payment_method_types: ["card"],
      customer_creation: "always",
      customer_email: email,
      metadata,
      setup_intent_data: { metadata, description: `${order.projectTitle}：目標達成時に ¥${order.amount.toLocaleString("ja-JP")} を請求` },
      success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${back}?reward=${order.rewardId}&canceled=1`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: stripeErrorMessage(e) }, 502);
  }
}
