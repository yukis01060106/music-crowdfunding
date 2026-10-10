// メンバーシップの解約・再開・上位プランへの変更を Stripe に反映する。
// 操作できるのは、その加入の決済（Checkout Session）の ID を持っている本人だけ（ログインを入れるまでの確認方法）。
// TODO: Supabase Auth を入れたら、ログイン中のユーザーの契約かどうかで確かめる
import { buildMembershipOrder, checkOrigin, checkRate, json, membershipProductName, readBody, stripe, stripeErrorMessage } from "@/lib/stripe-server";

type Action = "cancel" | "resume" | "upgrade";

export async function POST(request: Request) {
  const blocked = checkOrigin(request) ?? checkRate(request);
  if (blocked) return blocked;
  const s = stripe();
  if (!s) return json({ error: "決済の設定がまだです。" }, 503);

  const body = await readBody<{ sessionId: string; action: Action; planId: string }>(request);
  if (!body || typeof body.sessionId !== "string" || !/^cs_(test|live)_[\w]+$/.test(body.sessionId) || !["cancel", "resume", "upgrade"].includes(body.action as string)) {
    return json({ error: "操作の内容が正しくありません。" }, 400);
  }

  try {
    const session = await s.checkout.sessions.retrieve(body.sessionId);
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (session.mode !== "subscription" || session.status !== "complete" || !subscriptionId) return json({ error: "メンバーシップが見つかりません。" }, 404);

    if (body.action === "cancel" || body.action === "resume") {
      // 解約しても、次の更新日の前日まで特典を使える（期間の終わりで止める）
      const sub = await s.subscriptions.update(subscriptionId, { cancel_at_period_end: body.action === "cancel" });
      return json({ status: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end });
    }

    // 上位プランへの変更：特典はすぐ、月額は次の更新日から（日割りの請求はしない）
    // 下位プランへの変更は次の更新日から切り替えるので、ここでは扱わない（TODO: Subscription Schedule で予約する）
    const order = await buildMembershipOrder({ artistId: session.metadata?.artistId, planId: body.planId });
    if (typeof order === "string") return json({ error: order }, 400);
    const sub = await s.subscriptions.retrieve(subscriptionId);
    const item = sub.items.data[0];
    if (!item) return json({ error: "メンバーシップが見つかりません。" }, 404);
    // 上位のプランだけ受け付ける（下位への変更は次の更新日から。その場で安くさせない）
    if (order.price <= (item.price.unit_amount ?? 0)) return json({ error: "ここで変更できるのは、今より上位のプランだけです。" }, 400);
    // 同じプラン・同じ金額の Price は使い回す（変更のたびに Product と Price を増やさない）
    const lookupKey = `membership_${order.artistId}_${order.planId}_${order.price}`;
    const existing = await s.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    const price =
      existing.data[0] ??
      (await s.prices.create({ currency: "jpy", unit_amount: order.price, recurring: { interval: "month" }, lookup_key: lookupKey, product_data: { name: membershipProductName(order) } }));
    const updated = await s.subscriptions.update(subscriptionId, {
      items: [{ id: item.id, price: price.id }],
      proration_behavior: "none",
      metadata: { ...sub.metadata, planId: order.planId },
    });
    return json({ status: updated.status });
  } catch (e) {
    return json({ error: stripeErrorMessage(e) }, 502);
  }
}
