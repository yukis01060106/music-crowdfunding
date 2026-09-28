"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { MembershipPlan } from "@/types";
import { formatYen } from "@/lib/format";
import { FES_FUND_MESSAGE, PLATFORM_FEE_RATE } from "@/lib/fees";
import { isPlanFull, MEMBER_COMMON_PERKS } from "@/lib/membership";
import { joinMembership, login, useDemo } from "@/lib/demo-store";

type Step = "plan" | "payment" | "confirm" | "done";
type FormStep = Exclude<Step, "done">;

const STEPS: FormStep[] = ["plan", "payment", "confirm"];
const STEP_LABELS: Record<FormStep, string> = { plan: "プラン", payment: "お支払い", confirm: "確認" };

// 毎月の自動引き落としに使えるものだけ（コンビニ払いは継続課金に向かない）
const PAYMENT_METHODS = ["クレジットカード", "Apple Pay / Google Pay", "PayPay"] as const;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function JoinFlow({ artistId, artistName, plans }: { artistId: string; artistName: string; plans: MembershipPlan[] }) {
  const initialPlanId = useSearchParams().get("plan");
  const available = plans.filter((p) => !isPlanFull(p));
  const [step, setStep] = useState<Step>("plan");
  const [planId, setPlanId] = useState(available.some((p) => p.id === initialPlanId) ? initialPlanId : available[0]?.id);
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("クレジットカード");
  const [showErrors, setShowErrors] = useState(false);
  const { user, memberships } = useDemo();
  const contactEmail = user?.email ?? email;
  const currentPlanId = memberships.find((m) => m.artistId === artistId && !m.canceledAt)?.planId;

  const plan = available.find((p) => p.id === planId);
  if (!plan) return <p className="mt-8 text-stone-500">現在加入できるプランがありません。</p>;

  const current = STEPS.indexOf(step as FormStep);
  const toArtist = Math.floor(plan.price * (1 - PLATFORM_FEE_RATE));

  function next() {
    if (step === "payment" && !isEmail(contactEmail)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step === "confirm" && plan) {
      // 継続課金は解約の手続きが必要なので、メールアドレスでアカウントを作ってから加入する
      // TODO: Stripe Billing の Subscription を作成してから記録する
      if (!user) login({ name: contactEmail.split("@")[0], email: contactEmail, provider: "email" });
      joinMembership(artistId, plan.id);
    }
    setStep(STEPS[current + 1] ?? "done");
    window.scrollTo({ top: 0 });
  }
  function back() {
    setShowErrors(false);
    setStep(STEPS[current - 1] ?? "plan");
  }

  if (step === "done") {
    return (
      <div className="mx-auto mt-8 max-w-xl space-y-6 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <div>
          <p className="text-2xl font-bold text-emerald-800">{artistName}のメンバーになりました！</p>
          <p className="mt-2 text-sm text-stone-600">
            {contactEmail} に確認メールをお送りしました。
            <br />
            特典は今日から使えます。解約はマイページからいつでもできます。
          </p>
        </div>
        <div className="bg-white p-4 text-left text-sm">
          <p className="font-bold">プランの変更や解約は、マイページからいつでもできます</p>
          <p className="mt-1 text-stone-600">メンバー限定の活動報告も、マイページとメールでお届けします。</p>
          <Link href="/mypage/membership" className="mt-3 inline-block bg-brand px-4 py-2 font-medium text-white">
            マイページで確認する
          </Link>
        </div>
        <Link href={`/artists/${artistId}`} className="inline-block text-sm text-stone-600 underline">
          {artistName}のページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <ol className="flex gap-2 text-xs" aria-label="加入の手順">
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={s === step ? "step" : undefined}
              className={`flex-1 rounded-full py-1.5 text-center ${
                i < current ? "bg-brand-soft text-brand" : s === step ? "bg-brand text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              {i < current ? "✓ " : `${i + 1}. `}
              {STEP_LABELS[s]}
            </li>
          ))}
        </ol>

        {step === "plan" && (
          <fieldset className="space-y-3">
            <legend className="mb-2 font-bold">プランを選んでください</legend>
            {available.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer gap-3 border bg-white p-4 ${
                  p.id === planId ? "border-brand ring-1 ring-brand" : "border-stone-200"
                }`}
              >
                <input type="radio" name="plan" checked={p.id === planId} onChange={() => setPlanId(p.id)} className="mt-1 accent-brand" />
                <span className="flex-1">
                  <span className="flex justify-between gap-2 font-bold">
                    <span>
                      {p.name}
                      {p.id === currentPlanId && <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">いまのプラン</span>}
                    </span>
                    <span className="shrink-0">{formatYen(p.price)} / 月</span>
                  </span>
                  <span className="mt-1 block text-sm text-stone-600">{p.perks.join("・")}</span>
                </span>
              </label>
            ))}
            <p className="text-xs text-stone-500">
              どのプランにも、{MEMBER_COMMON_PERKS.map((perk) => perk.title).join("・")}が付きます。
            </p>
          </fieldset>
        )}

        {step === "payment" && (
          <div className="space-y-5">
            <section className="border border-stone-200 bg-white p-5">
              <h2 className="font-bold">メールアドレス</h2>
              {user ? (
                <p className="mt-2 text-sm">
                  ログイン中：<span className="font-bold">{user.name}</span>（{user.email}）
                  <span className="mt-1 block text-xs text-stone-500">確認メールと、メンバー限定の活動報告をこのアドレスにお送りします。</span>
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-stone-500">確認メールと、メンバー限定の活動報告をお送りします。このアドレスでアカウントが作られ、マイページから解約できます。</p>
                  <label className="mt-3 block text-sm">
                    メールアドレス
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      aria-invalid={showErrors && !isEmail(email)}
                      className={`mt-1 w-full rounded-lg border p-2 ${showErrors && !isEmail(email) ? "border-rose-500" : "border-stone-300"}`}
                    />
                    {showErrors && !isEmail(email) && <span className="mt-1 block text-xs text-rose-600">メールアドレスを正しく入力してください</span>}
                  </label>
                  <p className="mt-3 text-xs text-stone-500">
                    すでにアカウントをお持ちの方は{" "}
                    <Link href={`/login?next=${encodeURIComponent(`/artists/${artistId}/join?plan=${plan.id}`)}`} className="text-brand underline">
                      ログイン
                    </Link>
                  </p>
                </>
              )}
            </section>
            <section className="space-y-4 border border-stone-200 bg-white p-5">
              <h2 className="font-bold">お支払い方法</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${
                      paymentMethod === m ? "border-brand ring-1 ring-brand" : "border-stone-200"
                    }`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="accent-brand" />
                    {m}
                  </label>
                ))}
              </div>
              {/* TODO: Stripe Billing（Subscription）で月額課金する。加入日を毎月の更新日にする */}
              <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                ここに{paymentMethod}の入力欄（Stripe）が入ります
              </div>
              <p className="flex items-center gap-2 text-xs text-stone-500">
                <span aria-hidden>🔒</span>
                通信は暗号化され、カード情報は当サイトに保存されません。
              </p>
            </section>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 border border-stone-200 bg-white p-5">
            <h2 className="font-bold">内容の確認</h2>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-3 text-sm">
              <dt className="text-stone-500">プラン</dt>
              <dd>
                {artistName}・{plan.name}
              </dd>
              <dt className="text-stone-500">月額</dt>
              <dd>{formatYen(plan.price)}（税込）</dd>
              <dt className="text-stone-500">更新</dt>
              <dd>今日から1か月ごとに自動で更新</dd>
              <dt className="text-stone-500">メール</dt>
              <dd>{contactEmail}</dd>
              <dt className="text-stone-500">お支払い</dt>
              <dd>{paymentMethod}</dd>
            </dl>
            <p className="text-xs text-stone-500">
              加入することで<Link href="/legal/terms" className="underline">利用規約</Link>と
              <Link href="/legal/tokushoho" className="underline">特定商取引法に基づく表記</Link>に同意したものとみなします。
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {step !== "plan" && (
            <button type="button" onClick={back} className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm">
              戻る
            </button>
          )}
          <button type="button" onClick={next} className="flex-1 rounded-full bg-brand py-3.5 font-bold text-white hover:bg-brand-dark">
            {step === "confirm" ? `月額${formatYen(plan.price)}でメンバーになる` : "次へ"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 border border-stone-200 bg-white p-5 text-sm">
          <h2 className="font-bold">ご加入内容</h2>
          <div className="flex justify-between gap-2">
            <span className="text-stone-600">{plan.name}</span>
            <span className="shrink-0">{formatYen(plan.price)} / 月</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
            <span className="font-bold">毎月のお支払い</span>
            <span className="text-2xl font-bold">{formatYen(plan.price)}</span>
          </div>
          <p className="bg-brand-soft p-3 text-xs leading-relaxed text-brand">
            このうち{formatYen(toArtist)}が、毎月{artistName}に届きます。
          </p>
          <ul className="space-y-1 text-xs text-stone-500">
            <li>・いつでも解約できます</li>
            <li>・解約しても、次の更新日の前日まで特典を使えます</li>
          </ul>
          <p className="border-t border-stone-200 pt-3 text-xs text-stone-500">{FES_FUND_MESSAGE}</p>
        </div>
      </aside>
    </div>
  );
}
