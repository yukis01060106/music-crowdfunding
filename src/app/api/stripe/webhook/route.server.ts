import type Stripe from "stripe";
import { isTestMode, json, stripe } from "@/lib/stripe-server";
import { mails, sendEmail } from "@/lib/email";

/**
 * Stripe からの通知（Webhook）の受け口。決済の結果は、ブラウザの戻りではなく、ここで確定させる。
 * - 署名（STRIPE_WEBHOOK_SECRET）を必ず確かめ、偽の通知を受け付けない（生の本文で確かめる・古すぎる通知は Stripe のライブラリが断る）
 * - 同じ通知は一度だけ処理する。処理中に同じ通知が届いたら 409 を返し、あとで送り直してもらう
 * - 処理に失敗したら 500 を返し、Stripe に送り直してもらう。メールの失敗では失敗にしない
 *
 * TODO（本番）: 「記録する」部分を Supabase に書き込む（service role のクライアントで）。
 *   一度だけ処理するための記録は stripe_events テーブル（insert … on conflict do nothing で処理を取り、終わったら status = 'done'）で行う。
 *   今はメモリで持つので、サーバーが複数ある・再起動したときは忘れる。記録を先に、メールを後に送る
 */
const MAX_BODY = 512 * 1024;
const done = new Set<string>();
const processing = new Set<string>();

export async function POST(request: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!s || !secret) return json({ error: "webhook is not configured" }, 503);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "missing signature" }, 400);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "payload too large" }, 413);
  const body = await request.text();
  if (body.length > MAX_BODY) return json({ error: "payload too large" }, 413);

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(body, signature, secret);
  } catch {
    return json({ error: "invalid signature" }, 400);
  }
  // テストのキーで本番の通知を（またはその逆を）処理しない
  if (event.livemode === isTestMode()) return json({ error: "mode mismatch" }, 400);

  if (done.has(event.id)) return json({ received: true, duplicate: true });
  if (processing.has(event.id)) return json({ error: "already processing" }, 409);
  processing.add(event.id);

  try {
    await handle(s, event);
    done.add(event.id);
    if (done.size > 5000) done.delete(done.values().next().value as string);
    return json({ received: true });
  } catch (e) {
    console.error("[webhook]", event.type, e instanceof Error ? e.message : e);
    return json({ error: "handler failed" }, 500);
  } finally {
    processing.delete(event.id);
  }
}

const titleOf = (m: Stripe.Metadata | null | undefined) => m?.projectTitle || m?.projectSlug || "プロジェクト";

/** 支援者のメールアドレス（Stripe の Customer に登録されたもの） */
async function customerEmail(s: Stripe, customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): Promise<string | null> {
  if (!customer) return null;
  if (typeof customer !== "string") return "email" in customer ? (customer.email ?? null) : null;
  const c = await s.customers.retrieve(customer);
  return "email" in c ? (c.email ?? null) : null;
}

async function handle(s: Stripe, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_details?.email ?? session.customer_email;
      const meta = session.metadata ?? {};
      if (meta.kind !== "support" || !email) return; // TODO（本番）: kind === "membership" なら memberships に記録
      // TODO（本番）: backings に記録（stripe_checkout_session_id で重複を防ぐ）。state は payment_status から決める
      if (session.mode === "payment" && session.payment_status === "unpaid") {
        // コンビニ払い：申し込みの時点では、支払い待ちであることと期限を知らせる
        const pi = typeof session.payment_intent === "string" ? await s.paymentIntents.retrieve(session.payment_intent) : session.payment_intent;
        const expiresAt = pi?.next_action?.konbini_display_details?.expires_at;
        await sendEmail({ to: email, ...mails.konbiniPending({ projectTitle: titleOf(meta), amount: Number(meta.amount ?? 0), expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null }) });
        return;
      }
      const charged = session.mode === "payment" && session.payment_status === "paid";
      await sendEmail({ to: email, ...mails.supportCompleted({ projectTitle: titleOf(meta), amount: Number(meta.amount ?? 0), charged }) });
      return;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const email = session.customer_details?.email;
      // TODO（本番）: backings.state を 'charged' にする
      if (email) await sendEmail({ to: email, ...mails.konbiniPaid({ projectTitle: titleOf(session.metadata), amount: Number(session.metadata?.amount ?? 0) }) });
      return;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      const email = session.customer_details?.email;
      // コンビニ払いの期限切れ。TODO（本番）: backings.state を 'expired' にする（支援は無効）
      if (email) await sendEmail({ to: email, ...mails.konbiniExpired({ projectTitle: titleOf(session.metadata) }) });
      return;
    }
    case "checkout.session.expired":
      // 決済ページを開いたまま期限が切れたもの（支払いの申し込みはない）。記録だけ
      return;
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      // All-or-Nothing の後からの請求（metadata.checkoutSession があるもの）。TODO（本番）: backings.state を 'charged' に
      if (!pi.metadata?.checkoutSession) return;
      const email = await customerEmail(s, pi.customer);
      if (email) await sendEmail({ to: email, ...mails.aonCharged({ projectTitle: titleOf(pi.metadata), amount: pi.amount }) });
      return;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      if (!pi.metadata?.checkoutSession) return;
      // TODO（本番）: 運営の「決済の失敗」に載せる。backings.state を 'failed' に
      const email = await customerEmail(s, pi.customer);
      const needsAuth = pi.last_payment_error?.code === "authentication_required";
      if (email) await sendEmail({ to: email, ...mails.paymentFailed({ what: titleOf(pi.metadata), amount: pi.amount, needsAuth, retries: false }) });
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      // 今回返金した額（amount_refunded は累計なので、前の値との差をとる）
      const before = (event.data.previous_attributes as { amount_refunded?: number } | undefined)?.amount_refunded;
      // 前の値が付いていないときは、いちばん新しい返金の額を使う
      const amount = before !== undefined ? charge.amount_refunded - before : ((await s.refunds.list({ charge: charge.id, limit: 1 })).data[0]?.amount ?? charge.amount_refunded);
      // どのプロジェクトへの支援かは、PaymentIntent の metadata にある（Charge には引き継がれない）
      const pi = typeof charge.payment_intent === "string" ? await s.paymentIntents.retrieve(charge.payment_intent) : charge.payment_intent;
      // TODO（本番）: refunds.decision を 'refunded' にし、backings.state を 'refunded' にする
      const email = charge.billing_details?.email ?? (await customerEmail(s, charge.customer));
      if (email && amount > 0) await sendEmail({ to: email, ...mails.refunded({ amount, projectTitle: pi?.metadata?.projectTitle }) });
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      // メンバーシップの更新の失敗（Stripe が自動で請求し直す）。TODO（本番）: memberships.status を 'past_due' にする
      if (invoice.customer_email) await sendEmail({ to: invoice.customer_email, ...mails.paymentFailed({ what: "メンバーシップの更新", amount: invoice.amount_due, needsAuth: false, retries: true }) });
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO（本番）: memberships の status・plan_id・cancel_at を Stripe の値に合わせる
      return;
    default:
      return;
  }
}
