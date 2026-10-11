"use client";

import Link from "next/link";
import { Stepper } from "@/components/ui/stepper";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { MembershipPlan } from "@/types";
import { formatDate, formatYen } from "@/lib/format";
import { payoutAmount } from "@/lib/fees";
import { isPlanFull, lastBenefitDay, MEMBER_COMMON_PERKS, nextBillingDate, PLAN_CHANGE_RULE } from "@/lib/membership";
import { joinMembership, login, resumeMembership, useDemo } from "@/lib/demo-store";
import { confirmCheckout, startCheckout, STRIPE_ENABLED, STRIPE_TEST, updateMembership } from "@/lib/payments";
import { toast } from "@/components/ui/toast";
import { useNow } from "@/lib/use-now";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";

type Step = "plan" | "payment" | "confirm" | "done";
type FormStep = Exclude<Step, "done">;

const STEP_LABELS: Record<FormStep, string> = { plan: "プラン", payment: "お支払い", confirm: "確認" };

// 毎月の自動引き落としに使えるものだけ（PayPay・コンビニ払いは継続課金に使えない）
const PAYMENT_METHODS = ["クレジットカード", "Apple Pay / Google Pay"] as const;

/** 加入日の日にち（日本時間）。毎月の更新日になる */
const billingDay = (joinedAt: string) => new Date(new Date(joinedAt).getTime() + 9 * 60 * 60 * 1000).getUTCDate();

const JOIN_EMAIL_KEY = "otofund:join-email";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function JoinFlow({ artistId, artistName, plans }: { artistId: string; artistName: string; plans: MembershipPlan[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlanId = searchParams.get("plan");
  const returnedSessionId = searchParams.get("session_id");
  const { user, memberships } = useDemo();
  const now = useNow();
  // ログインしていないときは、加入中として扱わない（デモの初期データの加入を、知らない人に見せない）
  const membership = user ? memberships.find((m) => m.artistId === artistId && !m.canceledAt) : undefined;
  // 解約済みでも、特典を使える期間のうちは「再開」で戻れる（追加のお支払いなし・更新日はそのまま）
  const canceled = user ? memberships.find((m) => m.artistId === artistId && m.canceledAt) : undefined;
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
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(Boolean(returnedSessionId) && STRIPE_ENABLED);

  const [confirmFailed, setConfirmFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const wasCanceled = searchParams.get("canceled") === "1";

  // Stripe の決済画面から戻ってきたら、サーバーで加入の完了を確かめてから記録する
  useEffect(() => {
    if (!returnedSessionId || !STRIPE_ENABLED) return;
    let cancelled = false;
    confirmCheckout(returnedSessionId)
      .then((r) => {
        if (cancelled || r.kind !== "membership" || r.artistId !== artistId) throw new Error("決済の情報が、このアーティストのものではありません。");
        // すでに別の決済で加入中なら、上書きしない（古い完了ページを開き直したときなど）
        const existing = memberships.find((m) => m.artistId === artistId);
        if (existing?.stripeSessionId && existing.stripeSessionId !== r.sessionId && !existing.canceledAt) throw new Error(`すでにこのアーティストのメンバーです。二重に請求されている場合は、お問い合わせください（決済の番号：${r.sessionId}）。`);
        // メールアドレスは、決済の前にこの画面で入力されたものを使う（サーバーからは受け取らない）
        let savedEmail = "";
        try {
          savedEmail = sessionStorage.getItem(JOIN_EMAIL_KEY) ?? "";
          sessionStorage.removeItem(JOIN_EMAIL_KEY);
        } catch {
          // 読めなくても加入の記録はできる
        }
        if (!user && savedEmail) login({ name: savedEmail.split("@")[0], email: savedEmail, provider: "email" });
        joinMembership(r.artistId, r.planId, "new", r.sessionId);
        setDone("new");
        setDoneText("毎月同じ日（その日がない月は月末）に自動で更新されます。特典は今日から使えます。");
        setStep("done");
        setConfirmFailed(false);
        router.replace(pathname);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        // 確かめられなかったときは session_id を残し、もう一度確かめられるようにする（払い直しを防ぐ）
        setPayError(e.message);
        setConfirmFailed(true);
      })
      .finally(() => !cancelled && setConfirming(false));
    return () => {
      cancelled = true;
    };
    // 戻ってきたときと、「もう一度確かめる」を押したときだけ確かめる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry]);

  // 決済ページでキャンセルして戻ったときは、入力し直さなくてよいよう、確認の手順から再開する
  useEffect(() => {
    if (!wasCanceled || !initialPlanId) return;
    let saved = "";
    try {
      saved = sessionStorage.getItem(JOIN_EMAIL_KEY) ?? "";
    } catch {
      // 読めないときは、メールアドレスから入力し直してもらう
    }
    /* eslint-disable react-hooks/set-state-in-effect -- 保存された入力はブラウザでしか読めない */
    if (saved) setEmail(saved);
    if (user || isEmail(saved)) setStep("confirm");
    else setStep("payment");
    /* eslint-enable react-hooks/set-state-in-effect */
    // 戻ってきた最初の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 決済ページからブラウザの「戻る」で戻ったとき、移動中のまま固まらないようにする
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && setPaying(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
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

  // Stripe で加入した人は、下位への変更を選べない（次の更新日に切り替える仕組み＝Subscription Schedule がそろうまで）
  const stripeMember = STRIPE_ENABLED && Boolean(membership?.stripeSessionId);
  const lowerBlocked = (p: MembershipPlan) => stripeMember && currentPlan !== undefined && p.price < currentPlan.price;
  // 加入中の人が選べるプラン：いまのプラン・満員・止めている下位のプランを除く
  const selectable = (p: MembershipPlan) => p.id !== currentPlan?.id && !isPlanFull(p) && !lowerBlocked(p);
  const hasChoice = available.some(selectable);
  // 初めの描画では加入状況がまだ読めていないので、読めたら選べないプラン（いまのプラン・止めている下位）を選択から外す
  const planForId = plans.find((p) => p.id === planId);
  const selectedId = step !== "done" && currentPlan && planForId && !selectable(planForId) ? null : planId;
  const plan = available.find((p) => p.id === selectedId);
  if (confirming) {
    return (
      <p role="status" className="mt-8 border-[3px] border-ink/10 bg-white p-8 text-center text-sm">
        お支払いを確認しています…
      </p>
    );
  }
  if (confirmFailed) {
    return (
      <div role="alert" className="mx-auto mt-8 max-w-xl space-y-3 border-l-4 border-rose-600 bg-rose-50 p-6 text-sm text-rose-900">
        <p className="font-bold">お支払いの確認ができませんでした</p>
        <p>{payError}</p>
        <p>お支払いが済んでいる場合は、もう一度支払わずに、確認し直すかお問い合わせください。</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(true);
              setRetry((n) => n + 1);
            }}
            className={buttonClass("primary")}
          >
            もう一度確かめる
          </button>
          <Link href="/contact" className={buttonClass("secondary")}>
            お問い合わせ
          </Link>
        </div>
      </div>
    );
  }
  if (available.length === 0) return <p className="mt-8 text-stone-600">現在加入できるプランがありません。</p>;
  // 解約済みの人は、特典期間中かどうかが決まるまで何も出さない（新規加入の画面が一瞬見えないように）
  if (canceled && !membership && now === null) return <div className="mt-8 h-64 animate-pulse bg-stone-100" aria-label="読み込み中" />;

  const isMember = currentPlan !== undefined;
  const change: "new" | "upgrade" | "downgrade" = !isMember || !plan ? "new" : plan.price > currentPlan.price ? "upgrade" : "downgrade";
  const steps: FormStep[] = isMember ? ["plan", "confirm"] : ["plan", "payment", "confirm"];
  const current = steps.indexOf(step as FormStep);
  const toArtist = plan ? payoutAmount(plan.price) : 0;
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
    // 念のため：Stripe の契約と食い違う変更（下位への変更）は記録しない
    if (plan && lowerBlocked(plan)) {
      setPayError("下位プランへの変更は準備中です。");
      return;
    }
    if (step === "confirm" && plan && STRIPE_ENABLED && change === "new") {
      // 新規加入：Stripe の決済ページで月額の契約を作る。金額はサーバーがプランから決める
      setPaying(true);
      setPayError(null);
      try {
        if (contactEmail) sessionStorage.setItem(JOIN_EMAIL_KEY, contactEmail);
      } catch {
        // 保存できなくても決済はできる
      }
      startCheckout("/api/checkout/membership/", { artistId, planId: plan.id, email: contactEmail || undefined }).catch((e: Error) => {
        setPayError(e.message);
        setPaying(false);
      });
      return;
    }
    if (step === "confirm" && plan && STRIPE_ENABLED && change === "upgrade" && membership?.stripeSessionId) {
      // 上位プランへの変更：Stripe の契約のプランを書き換える（月額は次の更新日から）
      setPaying(true);
      setPayError(null);
      const kind = change;
      const text = timing;
      updateMembership(membership.stripeSessionId, "upgrade", plan.id)
        .then(() => {
          joinMembership(artistId, plan.id, kind);
          setDone(kind);
          setDoneText(text);
          goTo("done");
        })
        .catch((e: Error) => setPayError(e.message))
        .finally(() => setPaying(false));
      return;
    }
    if (step === "confirm" && plan) {
      // デモ、または下位プランへの変更（次の更新日からの切り替え予約）
      // TODO: Stripe では下位への変更を Subscription Schedule で次の更新日に予約する
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
            {STRIPE_ENABLED ? (
              <>{STRIPE_TEST ? "（テストモードのため、実際のお金は動いていません）" : "Stripe から領収のメールが届きます。"}</>
            ) : (
              <>
                {/* TODO: メールを送れるようになったら「確認メールをお送りしました」に戻す */}
                （デモ版）本番では {contactEmail} に確認メールが届きます。
              </>
            )}
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
            disabled={paying}
            onClick={() => {
              const done = () => {
                resumeMembership(artistId);
                toast("メンバーシップを再開しました");
              };
              if (!canceled?.stripeSessionId || !STRIPE_ENABLED) return done();
              setPaying(true);
              updateMembership(canceled.stripeSessionId, "resume")
                .then(done)
                .catch((e: Error) => toast(e.message))
                .finally(() => setPaying(false));
            }}
            className={buttonClass("primary")}
          >
            {paying ? "処理しています…" : "メンバーシップを再開する"}
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
        {wasCanceled && step !== "plan" && (
          <p role="status" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            お支払いはキャンセルされました（請求はありません）。内容を確かめて、もう一度お進みください。
          </p>
        )}
        {isMember && !hasChoice && (
          <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {stripeMember && plans.some(lowerBlocked)
              ? "いま変更できる上位のプランはありません。下位に変えたいときは、いったん解約し、特典の期間が終わってからもう一度加入してください。"
              : "いま変更できるプランはありません（ほかのプランは満員です）。"}
            <Link href="/mypage/membership" className="ml-1 font-bold underline">
              マイページへ戻る
            </Link>
          </p>
        )}
        {isMember && (
          <p className="bg-brand-soft px-4 py-3 text-sm text-brand">
            いま<span className="font-bold">{currentPlan.name}</span>プラン（{formatYen(currentPlan.price)} / 月）に加入中です。{hasChoice && "変更したいプランを選んでください。"}
          </p>
        )}
        <Stepper labels={steps.map((x) => STEP_LABELS[x])} current={current} label={isMember ? "プラン変更の手順" : "加入の手順"} />

        {step === "plan" && (
          <fieldset className="space-y-3">
            <legend className="mb-2">{heading(isMember ? "新しいプランを選んでください" : "プランを選んでください")}</legend>
            {available.map((p) => {
              const blocked = lowerBlocked(p);
              const isCurrent = p.id === currentPlan?.id || blocked;
              return (
                <label key={p.id} className={`flex gap-3 border-[3px] p-4 transition ${isCurrent ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${p.id === selectedId ? "border-brand bg-brand-soft/40" : "border-ink/10 bg-white"}`}>
                  <input
                    type="radio"
                    name="plan"
                    checked={p.id === selectedId}
                    disabled={isCurrent}
                    onChange={() => setPlanId(p.id)}
                    aria-invalid={showErrors && !plan && !isCurrent ? true : undefined}
                    aria-describedby={showErrors && !plan && !isCurrent ? errorId : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2 font-bold">
                      <span>
                        {p.name}
                        {p.id === currentPlan?.id && <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">いまのプラン</span>}
                        {blocked && <span className="ml-2 bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">下位への変更は準備中</span>}
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
            {isMember && stripeMember && hasChoice && plans.some(lowerBlocked) && (
              <p className="text-xs text-stone-500">下位プランに変えたいときは、いったん解約し、特典の期間が終わってからもう一度加入してください。</p>
            )}
          </fieldset>
        )}

        {step === "payment" && plan && (
          <div className="space-y-5">
            <section className="border-[3px] border-ink/10 bg-white p-5">
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
            {STRIPE_ENABLED ? (
              <section className="space-y-3 border-[3px] border-ink/10 bg-white p-5">
                <h3 className="font-bold">お支払い方法</h3>
                <p className="text-sm leading-relaxed">確認のあと、Stripe の安全な決済ページで、毎月のお支払いに使う方法を登録します。カード番号などは Oto Fundには届きません。</p>
                {STRIPE_TEST && (
                  <p className="bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    テストモードです。カード番号 4242 4242 4242 4242、有効期限は未来の日付、セキュリティコードは任意の3桁で試せます。実際のお金は動きません。
                  </p>
                )}
              </section>
            ) : (
            <section className="space-y-4 border-[3px] border-ink/10 bg-white p-5">
              <h3 className="font-bold">お支払い方法</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m} className={`flex min-h-11 cursor-pointer items-center gap-2 border-[3px] p-3 text-sm ${paymentMethod === m ? "border-brand" : "border-ink/10"}`}>
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
            )}
          </div>
        )}

        {step === "confirm" && plan && (
          <div className="space-y-4 border-[3px] border-ink/10 bg-white p-5">
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
                  <dd>{STRIPE_ENABLED ? "次の画面（Stripe）で登録します" : paymentMethod}</dd>
                </>
              )}
              {/* 毎月の課金なので、申し込みの直前に解約の方法を示す */}
              <dt className="text-stone-500">解約</dt>
              <dd>マイページの「メンバーシップ」からいつでもできます。解約しても、次の更新日の前日まで特典を使えます。</dd>
            </dl>
            <p className="text-xs text-stone-500">
              {isMember ? "変更する" : "加入する"}ことで<Link href="/legal/terms" className="underline">利用規約</Link>と
              <Link href="/legal/tokushoho" className="underline">特定商取引法に基づく表記</Link>に同意したものとみなします。
            </p>
          </div>
        )}

        {payError && (
          <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {payError}
          </p>
        )}
        {/* スマホでは画面の下に固定し、月額と「次へ」をいつでも押せるようにする（支援の流れと同じ） */}
        <div data-support-bar className="sticky bottom-0 z-20 -mx-4 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        {plan && (
          <p className="mb-2 flex items-baseline justify-between gap-3 text-sm lg:hidden" aria-live="polite">
            <span className="min-w-0 truncate text-stone-600">{plan.name}プラン</span>
            <span className="shrink-0 font-bold">月額 {formatYen(plan.price)}</span>
          </p>
        )}
        <div className="flex gap-3">
          {step !== "plan" && (
            <button type="button" onClick={() => goTo(steps[current - 1] ?? "plan")} className={buttonClass("secondary")}>
              戻る
            </button>
          )}
          <button type="button" onClick={next} disabled={paying || (isMember && !hasChoice)} className={buttonClass("primary", "lg", "flex-1")}>
            {paying
              ? "処理しています…"
              : step === "confirm" && plan
                ? isMember
                  ? `${plan.name}プランに変更する`
                  : STRIPE_ENABLED
                    ? `月額${formatYen(plan.price)}のお支払いへ進む`
                    : `月額${formatYen(plan.price)}でメンバーになる`
                : steps[current + 1] ? `次へ：${STEP_LABELS[steps[current + 1] as FormStep]}` : "次へ"}
          </button>
        </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 border-[3px] border-ink bg-white p-5 text-sm shadow-sticker-sm">
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
