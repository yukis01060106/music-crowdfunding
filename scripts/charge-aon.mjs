#!/usr/bin/env node
/**
 * All-or-Nothing のプロジェクトが目標を達成したとき、カードを登録した支援者に一斉に請求する。
 *
 * 使い方（既定は「確かめるだけ」。請求はしない）:
 *   node --env-file=.env.local scripts/charge-aon.mjs <プロジェクトの slug>
 *   node --env-file=.env.local scripts/charge-aon.mjs <プロジェクトの slug> --execute   # 実際に請求する
 *
 * 安全のための決まり
 * - 本番のキー（sk_live_）では、STRIPE_ALLOW_LIVE=1 と --live の両方がない限り動かない
 * - 同じ支援に二重に請求しない（支援の画面の請求と同じ冪等キー charge-<Checkout Session ID> を使い、前の請求も確かめる）
 * - 1件の失敗で止めず、最後に成功・失敗・本人認証が必要の件数を出す。失敗した人には Webhook からメールが届く
 *
 * - 本番では、目標の達成を確かめた合計を --expect-total=<円> で付ける（一致しないと請求しない）
 * TODO（本番）: 目標の達成は、Supabase の project_totals と projects.status = 'succeeded' で確かめてから実行する。
 *   対象は backings（state = 'awaiting'）から取り、返金・取り消し・停止したプロジェクトの支援を外す。結果は backings に記録する。
 *   募集の終了時刻に自動で動かす（Vercel Cron など）
 */
import Stripe from "stripe";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const execute = args.includes("--execute");
const live = args.includes("--live");
// 募集の開始日（YYYY-MM-DD）。付けると、それより前の決済ページを読まない（速くなる）
const sinceArg = args.find((a) => a.startsWith("--since="))?.split("=")[1];
if (sinceArg !== undefined && Number.isNaN(Date.parse(sinceArg))) {
  console.error(`--since の日付が読めません（${sinceArg}）。YYYY-MM-DD の形で指定してください。`);
  process.exit(1);
}
const since = sinceArg ? Math.floor(Date.parse(sinceArg) / 1000) : undefined;

if (!slug || !/^[a-z0-9-]{2,60}$/.test(slug)) {
  console.error("プロジェクトの slug を指定してください。例: node --env-file=.env.local scripts/charge-aon.mjs hoshizora-1st-album");
  process.exit(1);
}

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("STRIPE_SECRET_KEY が未設定です。.env.local に入れてください。");
  process.exit(1);
}
const isTest = /^(sk|rk)_test_/.test(key);
if (!isTest && !(live && process.env.STRIPE_ALLOW_LIVE === "1")) {
  console.error("本番のキーです。本番で請求するときは、STRIPE_ALLOW_LIVE=1 と --live の両方を付けてください。");
  process.exit(1);
}

const stripe = new Stripe(key);

/** カードを登録した（setup モードの）支援の Checkout Session を集める */
async function collectSessions() {
  const found = [];
  for await (const session of stripe.checkout.sessions.list({ limit: 100, status: "complete", expand: ["data.setup_intent"], ...(since ? { created: { gte: since } } : {}) })) {
    const m = session.metadata ?? {};
    if (session.mode !== "setup" || session.status !== "complete") continue;
    if (m.kind !== "support" || m.projectSlug !== slug || m.fundingModel !== "all_or_nothing") continue;
    const si = typeof session.setup_intent === "object" ? session.setup_intent : null;
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const paymentMethod = typeof si?.payment_method === "string" ? si.payment_method : si?.payment_method?.id;
    const amount = Number(m.amount);
    if (!customer || !paymentMethod || !Number.isInteger(amount) || amount <= 0) {
      found.push({ session, skip: "カードの情報が足りません" });
      continue;
    }
    found.push({ session, customer, paymentMethod, amount });
  }
  return found;
}

const yen = (n) => `¥${n.toLocaleString("ja-JP")}`;

let items;
try {
  items = await collectSessions();
} catch (e) {
  console.error(`Stripe に問い合わせできませんでした（${e?.type ?? e?.name ?? "error"}）。キーとネットワークを確かめてください。`);
  process.exit(1);
}
const chargeable = items.filter((i) => !i.skip);
const total = chargeable.reduce((s, i) => s + i.amount, 0);
console.log(`「${slug}」: カードを登録した支援 ${items.length}件、請求できるもの ${chargeable.length}件・合計 ${yen(total)}（${isTest ? "テストモード" : "本番"}）`);
for (const i of items.filter((x) => x.skip)) console.log(`  ・とばす: ${i.session.id}（${i.skip}）`);

// 本番では、確かめたときの合計（--expect-total=<円>）が一致しないと請求しない（目標の達成を人が確かめた証として）
const expected = Number(args.find((a) => a.startsWith("--expect-total="))?.split("=")[1]);
if (execute && !isTest && expected !== total) {
  console.error(`本番で請求するときは、確かめた合計を --expect-total=${total} のように付けてください（いまの合計と一致したときだけ請求します）。`);
  process.exit(1);
}

if (!execute) {
  console.log("確かめるだけで終わりました。実際に請求するときは --execute を付けてください。");
  process.exit(0);
}

const result = { succeeded: 0, already: 0, needsAction: 0, failed: 0 };
for (const i of chargeable) {
  try {
    // 前に請求していれば、とばす（支援の画面からテストで請求した分も含む）
    const prior = await stripe.paymentIntents.list({ customer: i.customer, limit: 20 });
    if (prior.data.some((p) => p.metadata?.checkoutSession === i.session.id && ["succeeded", "processing", "requires_capture", "requires_action"].includes(p.status))) {
      result.already++;
      continue;
    }
    const pi = await stripe.paymentIntents.create(
      {
        amount: i.amount,
        currency: "jpy",
        customer: i.customer,
        payment_method: i.paymentMethod,
        off_session: true,
        confirm: true,
        metadata: { ...i.session.metadata, checkoutSession: i.session.id },
        description: `目標達成による請求（${i.session.metadata?.projectTitle ?? slug}）`,
      },
      { idempotencyKey: `charge-${i.session.id}` },
    );
    if (pi.status === "succeeded") result.succeeded++;
    else result.needsAction++;
  } catch (e) {
    if (e?.code === "authentication_required") result.needsAction++;
    else result.failed++;
    console.log(`  ・失敗: ${i.session.id}（${e?.decline_code ?? e?.code ?? "error"}）`);
  }
}
console.log(`請求の結果: 成功 ${result.succeeded}件／前に請求済み ${result.already}件／本人認証が必要 ${result.needsAction}件／失敗 ${result.failed}件`);
console.log("本人認証が必要・失敗した支援者には、Webhook（payment_intent.payment_failed）からカードの更新をお願いするメールが届きます。");
