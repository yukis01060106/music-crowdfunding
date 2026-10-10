"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { FundingModel, Project, Reward } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatDate, formatPrice, formatYen } from "@/lib/format";
import { FES_FUND_MESSAGE } from "@/lib/fees";
import { addBacking, useDemo } from "@/lib/demo-store";
import { ShareButtons } from "@/components/project/share-buttons";
import { useOpenForSupport } from "@/components/project/support-cta";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { chipClass } from "@/components/ui/chip";

type Step = "reward" | "shipping" | "payment" | "confirm" | "done";
type FormStep = Exclude<Step, "done">;

const STEP_LABELS: Record<FormStep, string> = {
  reward: "リターン",
  shipping: "お届け先",
  payment: "お支払い",
  confirm: "確認",
};

/** 上乗せ支援の候補。リターンとは別に、気持ちを上乗せできる */
const TIP_OPTIONS = [0, 500, 1000, 3000];

const PAYMENT_METHODS = ["クレジットカード", "Apple Pay / Google Pay", "PayPay", "コンビニ払い"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * All-or-Nothing は「カードを保存しておき、目標を達成したときだけ請求する」仕組みなので、後から請求できる方法に限る。
 * コンビニ払い・PayPay は支援の時点でお金が動くため、「届かなければお支払いなし」を約束できない。
 */
const DEFERRED_METHODS: readonly PaymentMethod[] = ["クレジットカード", "Apple Pay / Google Pay"];
const methodsFor = (model: FundingModel): readonly PaymentMethod[] => (model === "all_or_nothing" ? DEFERRED_METHODS : PAYMENT_METHODS);

interface Shipping {
  name: string;
  postalCode: string;
  address: string;
  phone: string;
}

const SHIPPING_ERRORS: Record<keyof Shipping, (v: string) => string | null> = {
  name: (v) => (v.trim() ? null : "お名前を入力してください"),
  postalCode: (v) => (/^\d{3}-?\d{4}$/.test(v.trim()) ? null : "郵便番号は7桁の数字で入力してください（例: 150-0001）"),
  address: (v) => (v.trim() ? null : "住所を入力してください"),
  phone: (v) => (/^0\d{9,10}$/.test(v.replace(/-/g, "").trim()) ? null : "電話番号を正しく入力してください（例: 09012345678）"),
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** 入力途中の内容。ログインのためにページを離れても、戻ったときに続きから始められるよう保存する */
interface SupportDraft {
  step: FormStep;
  rewardId: string | null;
  quantity: number;
  tip: number;
  shipping: Shipping;
  email: string;
  paymentMethod: PaymentMethod;
  comment: string;
}

const draftKey = (slug: string) => `otofund:support:${slug}`;

const STEPS_TO_RESTORE: readonly FormStep[] = ["reward", "shipping", "payment"];

/** 保存された入力を検証して、形の正しい項目だけ返す（書き換えられた値で金額や手順がおかしくならないように） */
function loadSupportDraft(slug: string): Partial<SupportDraft> | null {
  try {
    const raw = sessionStorage.getItem(draftKey(slug));
    const v = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    if (!v || typeof v !== "object") return null;
    const str = (x: unknown) => (typeof x === "string" ? x.slice(0, 200) : "");
    const sh = v.shipping && typeof v.shipping === "object" ? (v.shipping as Record<string, unknown>) : null;
    return {
      step: STEPS_TO_RESTORE.includes(v.step as FormStep) ? (v.step as FormStep) : undefined,
      rewardId: typeof v.rewardId === "string" ? v.rewardId : null,
      quantity: Number.isInteger(v.quantity) && (v.quantity as number) >= 1 && (v.quantity as number) <= 10 ? (v.quantity as number) : undefined,
      tip: TIP_OPTIONS.includes(v.tip as number) ? (v.tip as number) : undefined,
      shipping: sh ? { name: str(sh.name), postalCode: str(sh.postalCode), address: str(sh.address), phone: str(sh.phone) } : undefined,
      email: str(v.email),
      paymentMethod: PAYMENT_METHODS.includes(v.paymentMethod as PaymentMethod) ? (v.paymentMethod as PaymentMethod) : undefined,
      comment: typeof v.comment === "string" ? v.comment.slice(0, 500) : "",
    };
  } catch {
    return null;
  }
}

/** 決済のタイミング。支援を決める前に必ず見えるところに出す */
function paymentTiming(model: FundingModel, endAt: string, isFree: boolean): string {
  if (isFree) return "0円の参加なので、お支払いはありません。";
  return model === "all_or_nothing"
    ? `目標を達成した場合だけ、募集終了後（${formatDate(endAt)}以降）に決済されます。届かなければお支払いはありません。`
    : "支援した時点で決済されます。目標に届かなくても、プロジェクトは実施されます。";
}

export function SupportFlow({
  project,
  projectSlug,
  projectTitle,
  fundingModel,
  rewards,
}: {
  project: Pick<Project, "slug" | "status" | "endAt">;
  projectSlug: string;
  projectTitle: string;
  fundingModel: FundingModel;
  rewards: Reward[];
}) {
  const pathname = usePathname();
  const initialRewardId = useSearchParams().get("reward");
  const available = rewards.filter((r) => r.limit === undefined || r.backers < r.limit);
  // URL で指定されたリターンが受付を終えていたら、黙って別のものを選ばず、自分で選んでもらう
  const requestedUnavailable = Boolean(initialRewardId) && !available.some((r) => r.id === initialRewardId);
  const [step, setStep] = useState<Step>("reward");
  const [rewardId, setRewardId] = useState<string | null>(requestedUnavailable ? null : (initialRewardId ?? available[0]?.id ?? null));
  const [quantity, setQuantity] = useState(1);
  const [tip, setTip] = useState(0);
  const [shipping, setShipping] = useState<Shipping>({ name: "", postalCode: "", address: "", phone: "" });
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("クレジットカード");
  const [comment, setComment] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { user, settings } = useDemo();
  const open = useOpenForSupport(project);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const rewardErrorId = useId();
  // 保存済みの入力を戻し終えるまでは保存しない（戻す前の空の入力で上書きしないように）
  const [restored, setRestored] = useState(false);
  const stepChanged = useRef(false);
  // ログイン中は、アカウントのメールアドレスに確認メールを送る
  const contactEmail = user?.email ?? email;

  // 前回の入力途中の内容を戻す（sessionStorage はブラウザでしか読めないので、描画後に）
  useEffect(() => {
    const saved = loadSupportDraft(projectSlug);
    /* eslint-disable react-hooks/set-state-in-effect -- 保存された入力はブラウザでしか読めない */
    setRestored(true);
    if (!saved) return;
    // 数量・上乗せ・手順は、同じリターンを戻せたときだけ戻す（別のリターンに前の数量が付かないように）
    if (saved.rewardId && available.some((r) => r.id === saved.rewardId) && (!initialRewardId || saved.rewardId === initialRewardId)) {
      setRewardId(saved.rewardId);
      const restoredReward = available.find((r) => r.id === saved.rewardId);
      const shippingOk = saved.shipping !== undefined && (Object.keys(SHIPPING_ERRORS) as (keyof Shipping)[]).every((k) => SHIPPING_ERRORS[k](saved.shipping![k]) === null);
      if (saved.step) setStep(saved.step === "payment" && restoredReward?.requiresShipping && !shippingOk ? "shipping" : saved.step);
      if (saved.quantity) setQuantity(saved.quantity);
      if (saved.tip !== undefined) setTip(saved.tip);
    }
    if (saved.shipping) setShipping(saved.shipping);
    if (typeof saved.email === "string") setEmail(saved.email);
    if (saved.paymentMethod && PAYMENT_METHODS.includes(saved.paymentMethod)) setPaymentMethod(saved.paymentMethod);
    if (typeof saved.comment === "string") setComment(saved.comment);
    /* eslint-enable react-hooks/set-state-in-effect */
    // 最初の1回だけ戻す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored || step === "done") return;
    const draft: SupportDraft = { step, rewardId, quantity, tip, shipping, email, paymentMethod, comment };
    try {
      sessionStorage.setItem(draftKey(projectSlug), JSON.stringify(draft));
    } catch {
      // 保存できない環境では、続きからの再開ができないだけ
    }
  }, [restored, projectSlug, step, rewardId, quantity, tip, shipping, email, paymentMethod, comment]);

  // 手順が変わったら、その手順の見出しへフォーカスを移す（読み上げソフトにも画面の切り替わりが伝わる）
  useEffect(() => {
    if (!stepChanged.current) return;
    headingRef.current?.focus();
  }, [step]);

  // 入力に誤りがあったら、最初の誤りの欄へ移動する
  useEffect(() => {
    if (attempt === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]:not(:disabled)');
    first?.focus();
    first?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [attempt]);

  if (!open) {
    return (
      <div className="mt-8 border border-stone-200 bg-white p-8 text-center">
        <p className="text-lg font-bold">このプロジェクトの募集は終了しました</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {project.status === "failed"
            ? "目標に届かなかったため、このプロジェクトは実施されません。All-or-Nothing 方式のため、支援した方への決済は行われていません。"
            : project.status === "succeeded"
              ? "たくさんのご支援ありがとうございました。目標を達成し、プロジェクトは実施されます。制作の様子は活動報告でお届けします。"
              : "募集期間が終わりました。結果と今後の予定は、活動報告でお知らせします。"}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/projects/${projectSlug}/updates`} className={buttonClass("secondary")}>
            活動報告を見る
          </Link>
          <Link href="/projects" className={buttonClass("primary")}>
            ほかのプロジェクトをさがす
          </Link>
        </div>
      </div>
    );
  }

  const reward = available.find((r) => r.id === rewardId);
  if (available.length === 0) return <p className="mt-8 text-stone-600">現在選べるリターンがありません。</p>;

  const isFree = reward?.price === 0;
  // 在庫限定のリターンは1個ずつ
  const maxQuantity = !reward || isFree || reward.limit !== undefined ? 1 : 10;
  const qty = Math.min(quantity, maxQuantity);
  const subtotal = (reward?.price ?? 0) * qty;
  const methods = methodsFor(fundingModel);
  const method = methods.includes(paymentMethod) ? paymentMethod : methods[0];
  const total = subtotal + (isFree ? 0 : tip);
  const steps: FormStep[] = ["reward", ...(reward?.requiresShipping ? (["shipping"] as const) : []), "payment", "confirm"];
  const current = steps.indexOf(step as FormStep);
  const loginHref = `/login?next=${encodeURIComponent(rewardId ? `${pathname}?reward=${rewardId}` : pathname)}`;

  const shippingErrors = Object.fromEntries(
    (Object.keys(SHIPPING_ERRORS) as (keyof Shipping)[]).map((k) => [k, SHIPPING_ERRORS[k](shipping[k])]),
  ) as Record<keyof Shipping, string | null>;
  const stepValid =
    step === "reward"
      ? Boolean(reward)
      : step === "shipping"
        ? Object.values(shippingErrors).every((e) => e === null)
        : step === "payment"
          ? isEmail(contactEmail)
          : true;

  function goTo(next: Step) {
    stepChanged.current = true;
    setShowErrors(false);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function next() {
    if (!stepValid) {
      setShowErrors(true);
      setAttempt((a) => a + 1);
      return;
    }
    if (step === "confirm" && reward) {
      // TODO: Stripe の決済（または SetupIntent）が成功してから記録する
      // TODO: 本番では金額をサーバーでリターンの価格から計算し直す（ブラウザの値は信用しない）
      addBacking({ projectSlug, rewardId: reward.id, quantity: qty, tip: isFree ? 0 : tip, amount: total, paymentMethod: isFree ? "0円" : method, comment: comment.trim() || undefined });
      try {
        sessionStorage.removeItem(draftKey(projectSlug));
      } catch {
        // 消せなくても支障はない
      }
    }
    goTo(steps[current + 1] ?? "done");
  }

  if (step === "done") {
    return (
      <div className="mx-auto mt-8 max-w-xl space-y-6 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-emerald-800 focus:outline-none">
            ご支援ありがとうございます！
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {/* TODO: メールを送れるようになったら「確認メールをお送りしました」に戻す */}
            （デモ版）本番では {contactEmail} に確認メールが届きます。
            <br />
            {reward && paymentTiming(fundingModel, project.endAt, isFree)}
          </p>
        </div>
        <div className="bg-white p-4 text-left">
          <ShareButtons title={projectTitle} path={`/projects/${projectSlug}/`} />
          <p className="mt-2 text-xs text-stone-500">あなたのシェアが、次の支援者につながります。</p>
        </div>
        <div className="bg-white p-4 text-left text-sm">
          {user ? (
            <>
              <p className="font-bold">支援内容はマイページで確認できます</p>
              <p className="mt-1 text-stone-600">決済の状況、お届け予定、活動報告をまとめて見られます。</p>
              <Link href="/mypage" className={buttonClass("primary", "md", "mt-3")}>
                マイページを見る
              </Link>
            </>
          ) : (
            <>
              <p className="font-bold">ログインすると、マイページが使えます</p>
              <p className="mt-1 text-stone-600">支援内容の確認、活動報告の通知、実行者へのメッセージができるようになります。パスワードは不要です。</p>
              <Link href="/login?next=/mypage" className={buttonClass("primary", "md", "mt-3")}>
                ログイン・会員登録
              </Link>
            </>
          )}
        </div>
        <p className="text-xs text-stone-500">{FES_FUND_MESSAGE}</p>
        <Link href={`/projects/${projectSlug}`} className="inline-block text-sm text-stone-600 underline">
          プロジェクトに戻る
        </Link>
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
        <ol className="flex gap-2 text-xs" aria-label="支援の手順">
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

        {step === "reward" && (
          <>
            {!user && (
              <p className="bg-brand-soft px-4 py-3 text-sm text-brand">
                会員登録なしで支援できます。
                <Link href={loginHref} className="ml-1 font-bold underline">
                  ログイン
                </Link>
                すると、登録済みのお届け先を使えます（入力した内容はそのまま残ります）。
              </p>
            )}
            {requestedUnavailable && (
              <p role="alert" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                選んだリターンは受付を終了しました。ほかのリターンからお選びください。
              </p>
            )}
            <fieldset className="space-y-3">
              <legend className="mb-2">{heading("リターンを選んでください")}</legend>
              {available.map((r) => (
                <label key={r.id} className={`flex cursor-pointer gap-3 border-2 bg-white p-4 transition ${r.id === rewardId ? "border-brand" : "border-stone-200 hover:border-stone-400"}`}>
                  <input
                    type="radio"
                    name="reward"
                    checked={r.id === rewardId}
                    onChange={() => {
                      setRewardId(r.id);
                      setQuantity(1);
                    }}
                    aria-invalid={showErrors && !reward ? true : undefined}
                    aria-describedby={showErrors && !reward ? rewardErrorId : undefined}
                    className="mt-1 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2 font-bold">
                      {r.title}
                      <span className="shrink-0">{formatPrice(r.price)}</span>
                    </span>
                    <span className="mt-1 block text-sm text-stone-600">{r.description}</span>
                    <span className="mt-1 block text-xs text-stone-500">
                      {REWARD_KIND_LABELS[r.kind]}・お届け予定 {r.deliveryEstimate}
                    </span>
                  </span>
                </label>
              ))}
              {showErrors && !reward && (
                <p id={rewardErrorId} className="text-sm text-rose-700">
                  リターンを1つ選んでください
                </p>
              )}
            </fieldset>
            {maxQuantity > 1 && (
              <label className="flex items-center gap-3 text-sm">
                数量
                <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="min-h-11 border border-stone-500 bg-white px-3">
                  {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
            {reward && !isFree && (
              <fieldset className="border border-stone-200 bg-white p-4">
                <legend className="px-1 text-sm font-bold">上乗せ支援（任意）</legend>
                <p className="text-xs text-stone-500">リターンはそのままに、応援の気持ちを上乗せできます。</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIP_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTip(t)}
                      aria-pressed={tip === t}
                      className={chipClass(tip === t)}
                    >
                      {t === 0 ? "なし" : `+${formatYen(t)}`}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </>
        )}

        {step === "shipping" && (
          <fieldset className="space-y-4 border border-stone-200 bg-white p-5">
            <legend className="px-1">{heading("お届け先")}</legend>
            {settings.addresses.length > 0 && user && (
              <div className="flex flex-wrap gap-2">
                {settings.addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setShipping({ name: a.name, postalCode: a.postalCode, address: a.address, phone: a.phone })}
                    className="min-h-11 border-2 border-brand px-3 text-left text-sm text-brand hover:bg-brand-soft"
                  >
                    登録済み：{a.name}（{a.address.slice(0, 10)}…）
                  </button>
                ))}
              </div>
            )}
            <Field label="お名前" value={shipping.name} onChange={(name) => setShipping({ ...shipping, name })} autoComplete="name" error={showErrors ? shippingErrors.name : null} />
            <Field label="郵便番号" value={shipping.postalCode} onChange={(postalCode) => setShipping({ ...shipping, postalCode })} autoComplete="postal-code" inputMode="numeric" placeholder="150-0001" error={showErrors ? shippingErrors.postalCode : null} />
            <Field label="住所" value={shipping.address} onChange={(address) => setShipping({ ...shipping, address })} autoComplete="street-address" error={showErrors ? shippingErrors.address : null} />
            <Field label="電話番号" value={shipping.phone} onChange={(phone) => setShipping({ ...shipping, phone })} autoComplete="tel" type="tel" placeholder="09012345678" error={showErrors ? shippingErrors.phone : null} />
            <p className="text-xs text-stone-500">お届け先は、リターンの発送のためだけに実行者へ共有されます。</p>
          </fieldset>
        )}

        {step === "payment" && (
          <div className="space-y-5">
            <section className="border border-stone-200 bg-white p-5">
              {heading("メールアドレスとお支払い")}
              {user ? (
                <p className="mt-2 text-sm">
                  ログイン中：<span className="font-bold">{user.name}</span>（{user.email}）
                  <span className="mt-1 block text-xs text-stone-500">このアドレスに確認メールと活動報告をお送りします。</span>
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-stone-500">会員登録は不要です。支援の確認メールと、活動報告をお送りします。</p>
                  <div className="mt-3">
                    <Field label="メールアドレス" value={email} onChange={setEmail} autoComplete="email" type="email" error={showErrors && !isEmail(email) ? "メールアドレスを正しく入力してください" : null} />
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    すでにアカウントをお持ちの方は{" "}
                    <Link href={loginHref} className="text-brand underline">
                      ログイン
                    </Link>
                    （入力した内容は残ります）
                  </p>
                </>
              )}
            </section>

            {!isFree && (
              <section className="space-y-4 border border-stone-200 bg-white p-5">
                <h3 className="font-bold">お支払い方法</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {methods.map((m) => (
                    <label key={m} className={`flex min-h-11 cursor-pointer items-center gap-2 border-2 p-3 text-sm ${method === m ? "border-brand" : "border-stone-200"}`}>
                      <input type="radio" name="payment" checked={method === m} onChange={() => setPaymentMethod(m)} className="accent-brand" />
                      {m}
                    </label>
                  ))}
                </div>
                {/* TODO: Stripe Payment Element を埋め込む。
                    All-or-Nothing は SetupIntent でカードを保存し、目標達成後に請求する。
                    All-in は PaymentIntent でその場で決済する。 */}
                <div className="border border-dashed border-stone-400 p-6 text-center text-sm text-stone-500">（デモ版）ここに{method}の入力欄（Stripe）が入ります</div>
                {fundingModel === "all_or_nothing" && (
                  <p className="text-xs leading-relaxed text-stone-600">目標を達成したときだけ請求するため、後からお支払いできる方法（カード・Apple Pay / Google Pay）に限っています。</p>
                )}
                <p className="flex items-center gap-2 text-xs text-stone-500">
                  <span aria-hidden>🔒</span>
                  通信は暗号化され、{method === "コンビニ払い" || method === "PayPay" ? "お支払いの情報は決済会社が管理します。" : "カード情報は当サイトに保存されません。"}
                </p>
              </section>
            )}
          </div>
        )}

        {step === "confirm" && reward && (
          <div className="space-y-4 border border-stone-200 bg-white p-5">
            {heading("内容の確認")}
            <dl className="divide-y divide-stone-100 text-sm">
              <ConfirmRow label="リターン" onEdit={() => goTo("reward")}>
                {reward.title} × {qty}
                <span className="block text-xs text-stone-500">お届け予定 {reward.deliveryEstimate}</span>
              </ConfirmRow>
              {reward.requiresShipping && (
                <ConfirmRow label="お届け先" onEdit={() => goTo("shipping")}>
                  {shipping.name}
                  <br />〒{shipping.postalCode} {shipping.address}
                </ConfirmRow>
              )}
              <ConfirmRow label="メール" onEdit={user ? undefined : () => goTo("payment")}>
                {contactEmail}
              </ConfirmRow>
              {!isFree && (
                <ConfirmRow label="お支払い" onEdit={() => goTo("payment")}>
                  {method}
                </ConfirmRow>
              )}
              <ConfirmRow label="金額">
                <span className="flex justify-between">
                  <span>小計</span>
                  <span>{formatPrice(subtotal)}</span>
                </span>
                {!isFree && tip > 0 && (
                  <span className="flex justify-between">
                    <span>上乗せ支援</span>
                    <span>{formatYen(tip)}</span>
                  </span>
                )}
                <span className="mt-1 flex justify-between font-bold">
                  <span>合計（税込・送料込み）</span>
                  <span>{formatPrice(total)}</span>
                </span>
              </ConfirmRow>
              <ConfirmRow label="決済">{paymentTiming(fundingModel, project.endAt, isFree)}</ConfirmRow>
            </dl>
            <label className="block text-sm">
              応援コメント（任意・プロジェクトページに公開されます）
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} placeholder="アーティストへのメッセージをどうぞ" className={inputClass} />
            </label>
            <p className="text-xs text-stone-500">
              支援することで<Link href="/legal/terms" className="underline">利用規約</Link>と
              <Link href="/legal/tokushoho" className="underline">特定商取引法に基づく表記</Link>に同意したものとみなします。
            </p>
          </div>
        )}

        {/* スマホでは合計欄が下に回るので、ボタンの直前に合計を出す */}
        {reward && (
          <p className="flex items-baseline justify-between bg-white px-4 py-3 text-sm lg:hidden">
            <span className="text-stone-600">合計（税込・送料込み）</span>
            <span className="text-xl font-bold">{formatPrice(total)}</span>
          </p>
        )}

        <div className="flex gap-3">
          {step !== "reward" && (
            <button type="button" onClick={() => goTo(steps[current - 1] ?? "reward")} className={buttonClass("secondary")}>
              戻る
            </button>
          )}
          <button type="button" onClick={next} className={buttonClass("primary", "lg", "flex-1")}>
            {step === "confirm" ? (isFree ? "0円で参加する" : `${formatYen(total)}で支援する`) : "次へ"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 border border-stone-200 bg-white p-5 text-sm">
          <h2 className="font-bold">ご支援内容</h2>
          {reward ? (
            <>
              <div className="flex justify-between gap-2">
                <span className="text-stone-600">
                  {reward.title}
                  {qty > 1 && ` × ${qty}`}
                </span>
                <span className="shrink-0">{formatPrice(subtotal)}</span>
              </div>
              {!isFree && tip > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-600">上乗せ支援</span>
                  <span>{formatYen(tip)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">送料</span>
                <span>込み</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
                <span className="font-bold">合計（税込・送料込み）</span>
                <span className="text-2xl font-bold">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-stone-500">お届け予定：{reward.deliveryEstimate}</p>
              <p className="bg-stone-50 p-3 text-xs leading-relaxed text-stone-700">{paymentTiming(fundingModel, project.endAt, isFree)}</p>
            </>
          ) : (
            <p className="text-stone-600">リターンを選ぶと、ここに金額が出ます。</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function ConfirmRow({ label, onEdit, children }: { label: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_1fr_auto] items-start gap-3 py-3">
      <dt className="text-stone-500">{label}</dt>
      <dd>{children}</dd>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="min-h-11 px-2 text-xs text-brand underline" aria-label={`${label}を変更`}>
          変更
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  type = "text",
  inputMode,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  error: string | null;
}) {
  const errorId = useId();
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        required
        className={inputClass}
      />
      {error && (
        <span id={errorId} className="mt-1 block text-xs text-rose-700">
          {error}
        </span>
      )}
    </label>
  );
}
