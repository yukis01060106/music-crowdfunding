"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { MembershipPlan } from "@/types";
import { formatDate, formatYen } from "@/lib/format";
import { PLATFORM_FEE_RATE } from "@/lib/fees";
import { isPlanFull, lastBenefitDay, MEMBER_COMMON_PERKS, nextBillingDate, PLAN_CHANGE_RULE } from "@/lib/membership";
import { joinMembership, login, resumeMembership, useDemo } from "@/lib/demo-store";
import { toast } from "@/components/ui/toast";
import { useNow } from "@/lib/use-now";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";

type Step = "plan" | "payment" | "confirm" | "done";
type FormStep = Exclude<Step, "done">;

const STEP_LABELS: Record<FormStep, string> = { plan: "プラン", payment: "お支払い", confirm: "確認" };

// 毎月の自動引き落としに使えるものだけ（コンビニ払いは継続課金に向かない）
const PAYMENT_METHODS = ["クレジットカード", "Apple Pay / Google Pay", "PayPay"] as const;

/** 加入日の日にち（日本時間）。毎月の更新日になる */
const billingDay = (joinedAt: string) => new Date(new Date(joinedAt).getTime() + 9 * 60 * 60 * 1000).getUTCDate();

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function JoinFlow({ artistId, artistName, plans }: { artistId: string; artistName: string; plans: MembershipPlan[] }) {
  const pathname = usePathname();
  const initialPlanId = useSearchParams().get("plan");
  const { user, memberships } = useDemo();
  const now = useNow();
  const membership = memberships.find((m) => m.artistId === artistId && !m.canceledAt);
  // 解約済みでも、特典を使える期間のうちは「再開」で戻れる（追加のお支払いなし・更新日はそのまま）
  const canceled = memberships.find((m) => m.artistId === artistId && m.canceledAt);
  const canceledLastDay = canceled?.canceledAt ? lastBenefitDay(canceled.joinedAt, new Date(canceled.canceledAt).getTime()) : null;
  const canResume = canceled !== undefined && canceledLastDay !== null && now !== null && now < canceledLastDay.getTime() + 24 * 60 * 60 * 1000;
  const currentPlan = plans.find((p) => p.id === membership?.planId);
  const available = plans.filter((p) => !isPlanFull(p) || p.id === currentPlan?.id);
  const [step, setStep] = useState<Step>("plan");
  // 加入中なら、いまのプランは選べない。指定がいまのプランなら、自分で選んでもらう
  const [planId, setPlanId] = useState<string | null>(available.some((p) => p.id === initialPlanId) ? initialPlanId : (available.find((p) => !isPlanFull(p))?.id ?? null));
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("クレジットカード");
  const [showErrors, setShowErrors] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState<"new" | "upgrade" | "downgrade" | null>(null);
  // 完了後は加入状況が更新されて change が変わるので、申し込んだ時点の内容を覚えておく
  const [doneText, setDoneText] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const stepChanged = useRef(false);
  const errorId = useId();
  const contactEmail = user?.email ?? email;

  useEffect(() => {
    if (stepChanged.current) headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (attempt === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]:not(:disabled)');
    first?.focus();
    first?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [attempt]);

  // 初めの描画では加入状況がまだ読めていないので、読めたら「いまのプラン」を選択から外す
  const selectedId = currentPlan && planId === currentPlan.id && step === "plan" ? null : planId;
  const plan = available.find((p) => p.id === selectedId);
  if (available.length === 0) return <p className="mt-8 text-stone-600">現在加入できるプランがありません。</p>;
  // 解約済みの人は、特典期間中かどうかが決まるまで何も出さない（新規加入の画面が一瞬見えないように）
  if (canceled && !membership && now === null) return <div className="mt-8 h-64 animate-pulse bg-stone-100" aria-label="読み込み中" />;

  const isMember = currentPlan !== undefined;
  const change: "new" | "upgrade" | "downgrade" = !isMember || !plan ? "new" : plan.price > currentPlan.price ? "upgrade" : "downgrade";
  const steps: FormStep[] = isMember ? ["plan", "confirm"] : ["plan", "payment", "confirm"];
  const current = steps.indexOf(step as FormStep);
  const toArtist = plan ? Math.floor(plan.price * (1 - PLATFORM_FEE_RATE)) : 0;
  const renewal = membership && now !== null ? formatDate(nextBillingDate(membership.joinedAt, now).toISOString()) : null;
  const timingFor = (kind: "new" | "upgrade" | "downgrade", price?: number, fromName?: string) =>
    kind === "new"
      ? "今日お支払いいただき、以降は毎月同じ日（その日がない月は月末）に自動で更新されます。特典は今日から使えます。"
      : kind === "upgrade"
        ? `新しい特典は今日から使えます。月額は次回の更新日（${renewal ?? "毎月の更新日"}）から${price ? formatYen(price) : "新しい金額"}になります。`
        : `次回の更新日（${renewal ?? "毎月の更新日"}）から切り替わります。それまでは今の${fromName ?? ""}プランの特典を使えます。`;
  const timing = timingFor(change, plan?.price, currentPlan?.name);
  function goTo(next: Step) {
    stepChanged.current = true;
    setShowErrors(false);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function next() {
    const invalid = (step === "plan" && !plan) || (step === "payment" && !isEmail(contactEmail));
    if (invalid) {
      setShowErrors(true);
      setAttempt((a) => a + 1);
      return;
    }
    if (step === "confirm" && plan) {
      // 継続課金は解約の手続きが必要なので、メールアドレスでアカウントを作ってから加入する
      // TODO: 本番では Supabase Auth のマジックリンクでメールアドレスを確認してから Subscription を作る（他人のアドレスで加入させない）
      // TODO: Stripe Billing の Subscription を作成・変更してから記録する
      if (!user) login({ name: contactEmail.split("@")[0], email: contactEmail, provider: "email" });
      joinMembership(artistId, plan.id, change);
      setDone(change);
      setDoneText(timing);
    }
    goTo(steps[current + 1] ?? "done");
  }

  if (step === "done" && done) {
    return (
      <div className="mx-auto mt-8 max-w-xl space-y-6 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-emerald-800 focus:outline-none">
            {done === "new" ? `${artistName}のメンバーになりました！` : "プランの変更を受け付けました"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {/* TODO: メールを送れるようになったら「確認メールをお送りしました」に戻す */}
            （デモ版）本番では {contactEmail} に確認メールが届きます。
            <br />
            {doneText}
          </p>
        </div>
        <div className="bg-white p-4 text-left text-sm">
          <p className="font-bold">プランの変更や解約は、マイページからいつでもできます</p>
          <p className="mt-1 text-stone-600">メンバー限定の活動報告も、マイページとメールでお届けします。</p>
          <Link href="/mypage/membership" className={buttonClass("primary", "md", "mt-3")}>
            マイページで確認する
          </Link>
        </div>
        <Link href={`/artists/${artistId}`} className="inline-block text-sm text-stone-600 underline">
          {artistName}のページに戻る
        </Link>
      </div>
    );
  }

  // 解約済みで特典期間中なら、新しく加入（もう一度お支払い）させず、再開だけを案内する
  if (!isMember && canResume && canceledLastDay) {
    return (
      <div className="mx-auto mt-8 max-w-xl space-y-4 border-l-4 border-brand bg-brand-soft p-6 text-sm text-ink">
        <p className="text-base font-bold">このメンバーシップは解約済みです</p>
        <p className="leading-relaxed">
          {formatDate(canceledLastDay.toISOString())}まで特典を使える期間です。再開すると、追加のお支払いはなく、更新日も変わりません。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              resumeMembership(artistId);
              toast("メンバーシップを再開しました");
            }}
            className={buttonClass("primary")}
          >
            メンバーシップを再開する
          </button>
          <Link href="/mypage/membership" className={buttonClass("secondary")}>
            マイページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  const heading = (text: string) => (
    <h2 ref={headingRef} tabIndex={-1} className="font-bold focus:outline-none">
      {text}
    </h2>
  );

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div ref={formRef} className="min-w-0 space-y-6">
        {isMember && !available.some((p) => p.id !== currentPlan.id) && (
          <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            いま変更できるプランはありません（ほかのプランは満員です）。
            <Link href="/mypage/membership" className="ml-1 font-bold underline">
              マイページへ戻る
            </Link>
          </p>
        )}
        {isMember && (
          <p className="bg-brand-soft px-4 py-3 text-sm text-brand">
            いま<span className="font-bold">{currentPlan.name}</span>プラン（{formatYen(currentPlan.price)} / 月）に加入中です。変更したいプランを選んでください。
          </p>
        )}
        <ol className="flex gap-2 text-xs" aria-label={isMember ? "プラン変更の手順" : "加入の手順"}>
          {steps.map((s, i) => (
            <li
              key={s}
              aria-current={s === step ? "step" : undefined}
              className={`flex-1 py-1.5 text-center ${i < current ? "bg-brand-soft text-brand" : s === step ? "bg-brand font-bold text-white" : "bg-stone-200 text-stone-700"}`}
            >
              {i < current ? (
                <>
                  <span aria-hidden>✓ </span>
                  <span className="sr-only">完了：</span>
                </>
              ) : (
                `${i + 1}. `
              )}
              {STEP_LABELS[s]}
            </li>
          ))}
        </ol>

        {step === "plan" && (
          <fieldset className="space-y-3">
            <legend className="mb-2">{heading(isMember ? "新しいプランを選んでください" : "プランを選んでください")}</legend>
            {available.map((p) => {
              const isCurrent = p.id === currentPlan?.id;
              return (
                <label key={p.id} className={`flex gap-3 border-2 bg-white p-4 transition ${isCurrent ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${p.id === selectedId ? "border-brand" : "border-stone-200"}`}>
                  <input
                    type="radio"
                    name="plan"
                    checked={p.id === selectedId}
                    disabled={isCurrent}
                    onChange={() => setPlanId(p.id)}
                    aria-invalid={showErrors && !plan && !isCurrent ? true : undefined}
                    aria-describedby={showErrors && !plan && !isCurrent ? errorId : undefined}
                    className="mt-1 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2 font-bold">
                      <span>
                        {p.name}
                        {isCurrent && <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">いまのプラン</span>}
                      </span>
                      <span className="shrink-0">{formatYen(p.price)} / 月</span>
                    </span>
                    <span className="mt-1 block text-sm text-stone-600">{p.perks.join("・")}</span>
                  </span>
                </label>
              );
            })}
            {showErrors && !plan && (
              <p id={errorId} className="text-sm text-rose-700">
                プランを1つ選んでください
              </p>
            )}
            <p className="text-xs text-stone-500">どのプランにも、{MEMBER_COMMON_PERKS.map((perk) => perk.title).join("・")}が付きます。</p>
            {isMember && <p className="text-xs text-stone-500">{PLAN_CHANGE_RULE}</p>}
          </fieldset>
        )}

        {step === "payment" && plan && (
          <div className="space-y-5">
            <section className="border border-stone-200 bg-white p-5">
              {heading("メールアドレスとお支払い")}
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
                      aria-invalid={showErrors && !isEmail(email) ? true : undefined}
                      aria-describedby={showErrors && !isEmail(email) ? errorId : undefined}
                      className={inputClass}
                    />
                    {showErrors && !isEmail(email) && (
                      <span id={errorId} className="mt-1 block text-xs text-rose-700">
                        メールアドレスを正しく入力してください
                      </span>
                    )}
                  </label>
                  <p className="mt-3 text-xs text-stone-500">
                    すでにアカウントをお持ちの方は{" "}
                    <Link href={`/login?next=${encodeURIComponent(`${pathname}?plan=${plan.id}`)}`} className="text-brand underline">
                      ログイン
                    </Link>
                  </p>
                </>
              )}
            </section>
            <section className="space-y-4 border border-stone-200 bg-white p-5">
              <h3 className="font-bold">お支払い方法</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m} className={`flex min-h-11 cursor-pointer items-center gap-2 border-2 p-3 text-sm ${paymentMethod === m ? "border-brand" : "border-stone-200"}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="accent-brand" />
                    {m}
                  </label>
                ))}
              </div>
              {/* TODO: Stripe Billing（Subscription）で月額課金する。加入日を毎月の更新日にする */}
              <div className="border border-dashed border-stone-400 p-6 text-center text-sm text-stone-500">（デモ版）ここに{paymentMethod}の入力欄（Stripe）が入ります</div>
              <p className="flex items-center gap-2 text-xs text-stone-500">
                <span aria-hidden>🔒</span>
                通信は暗号化され、カード情報は当サイトに保存されません。
              </p>
            </section>
          </div>
        )}

        {step === "confirm" && plan && (
          <div className="space-y-4 border border-stone-200 bg-white p-5">
            {heading("内容の確認")}
            <dl className="grid grid-cols-[6rem_1fr] gap-y-3 text-sm">
              <dt className="text-stone-500">プラン</dt>
              <dd>
                {artistName}・{isMember && currentPlan ? `${currentPlan.name} → ` : ""}
                {plan.name}
              </dd>
              <dt className="text-stone-500">月額</dt>
              <dd>{formatYen(plan.price)}（税込）</dd>
              <dt className="text-stone-500">{isMember ? "反映" : "更新"}</dt>
              <dd>{timing}</dd>
              {membership && now !== null && (
                <>
                  <dt className="text-stone-500">更新日</dt>
                  <dd>
                    毎月{billingDay(membership.joinedAt)}日{billingDay(membership.joinedAt) >= 29 && "（その日がない月は月末）"}（変わりません）
                  </dd>
                </>
              )}
              <dt className="text-stone-500">メール</dt>
              <dd>{contactEmail}</dd>
              {!isMember && (
                <>
                  <dt className="text-stone-500">お支払い</dt>
                  <dd>{paymentMethod}</dd>
                </>
              )}
            </dl>
            <p className="text-xs text-stone-500">
              {isMember ? "変更する" : "加入する"}ことで<Link href="/legal/terms" className="underline">利用規約</Link>と
              <Link href="/legal/tokushoho" className="underline">特定商取引法に基づく表記</Link>に同意したものとみなします。
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {step !== "plan" && (
            <button type="button" onClick={() => goTo(steps[current - 1] ?? "plan")} className={buttonClass("secondary")}>
              戻る
            </button>
          )}
          <button type="button" onClick={next} disabled={isMember && !available.some((p) => p.id !== currentPlan.id)} className={buttonClass("primary", "lg", "flex-1")}>
            {step === "confirm" && plan ? (isMember ? `${plan.name}プランに変更する` : `月額${formatYen(plan.price)}でメンバーになる`) : "次へ"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 border border-stone-200 bg-white p-5 text-sm">
          <h2 className="font-bold">{isMember ? "変更の内容" : "ご加入内容"}</h2>
          {plan ? (
            <>
              <div className="flex justify-between gap-2">
                <span className="text-stone-600">{plan.name}</span>
                <span className="shrink-0">{formatYen(plan.price)} / 月</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
                <span className="font-bold">毎月のお支払い（税込）</span>
                <span className="text-2xl font-bold">{formatYen(plan.price)}</span>
              </div>
              <p className="bg-brand-soft p-3 text-xs leading-relaxed text-brand">
                このうち{formatYen(toArtist)}が、毎月{artistName}に届きます。
              </p>
            </>
          ) : (
            <p className="text-stone-600">プランを選ぶと、ここに金額が出ます。</p>
          )}
          <ul className="space-y-1 text-xs text-stone-600">
            <li>・いつでも解約できます</li>
            <li>
              ・解約しても、
              {membership && now !== null ? `${formatDate(lastBenefitDay(membership.joinedAt, now).toISOString())}まで` : "次の更新日の前日まで"}
              特典を使えます
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
