// All-or-Nothing の支援に、登録済みのカードで請求する（目標を達成したときの処理）。
// テストモードでだけ使える。本番では、募集終了時にサーバーの処理（定期実行）が、目標を達成したプロジェクトの支援にまとめて請求する。
// TODO: Supabase を入れたら、支援のテーブルから対象を取り出して請求し、失敗した人には再登録のお願いをメールで送る
import Stripe from "stripe";
import { checkOrigin, checkRate, isTestMode, json, readBody, stripe, stripeErrorMessage } from "@/lib/stripe-server";

export async function POST(request: Request) {
  const blocked = checkOrigin(request) ?? checkRate(request);
  if (blocked) return blocked;
  const s = stripe();
  if (!s) return json({ error: "決済の設定がまだです。" }, 503);
  if (!isTestMode()) return json({ error: "この操作はテストモードでだけ使えます。" }, 403);

  const body = await readBody<{ sessionId: string }>(request);
  const id = body?.sessionId;
  if (typeof id !== "string" || !/^cs_test_[\w]+$/.test(id)) return json({ error: "支援の情報が正しくありません。" }, 400);

  try {
    const session = await s.checkout.sessions.retrieve(id, { expand: ["setup_intent"] });
    const m = session.metadata ?? {};
    const setupIntent = session.setup_intent && typeof session.setup_intent !== "string" ? session.setup_intent : null;
    if (session.mode !== "setup" || session.status !== "complete" || m.kind !== "support" || m.fundingModel !== "all_or_nothing" || !setupIntent) {
      return json({ error: "請求できる支援ではありません。" }, 400);
    }
    const paymentMethod = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method?.id;
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const amount = Number(m.amount);
    if (!paymentMethod || !customer || !Number.isInteger(amount) || amount <= 0) return json({ error: "請求できる支援ではありません。" }, 400);

    // 二重請求を防ぐ：冪等キーは約24時間で切れるので、Stripe 側にすでに請求があるかも確かめる
    const prior = await s.paymentIntents.list({ customer, limit: 20 });
    const already = prior.data.find((p) => p.metadata?.checkoutSession === session.id && ["succeeded", "processing", "requires_capture", "requires_action"].includes(p.status));
    if (already) return json({ status: already.status, charged: already.status === "succeeded" });

    const pi = await s.paymentIntents.create(
      {
        amount,
        currency: "jpy",
        customer,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        metadata: { ...m, checkoutSession: session.id },
        description: `目標達成による請求（${m.projectSlug}）`,
      },
      { idempotencyKey: `charge-${session.id}` },
    );
    return json({ status: pi.status, charged: pi.status === "succeeded" });
  } catch (e) {
    // 本人の認証（3Dセキュア）が要るカードは、後から自動では請求できない
    if (e instanceof Stripe.errors.StripeCardError && e.code === "authentication_required") {
      return json({ error: "このカードは本人の認証が必要なため、自動で請求できませんでした。本番では支援者に支払いのお願いを送ります。" }, 402);
    }
    return json({ error: stripeErrorMessage(e) }, 502);
  }
}
