"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FundingModel, Reward } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatYen } from "@/lib/format";
import { ShareButtons } from "@/components/project/share-buttons";

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
  phone: (v) => (/^0\d{9,10}$/.test(v.replace(/-/g, "").trim()) ? null : "電話番号を正しく入力してください"),
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function SupportFlow({
  projectSlug,
  projectTitle,
  fundingModel,
  rewards,
}: {
  projectSlug: string;
  projectTitle: string;
  fundingModel: FundingModel;
  rewards: Reward[];
}) {
  const initialRewardId = useSearchParams().get("reward");
  const available = rewards.filter((r) => r.limit === undefined || r.backers < r.limit);
  const [step, setStep] = useState<Step>("reward");
  const [rewardId, setRewardId] = useState(
    available.some((r) => r.id === initialRewardId) ? initialRewardId : available[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [tip, setTip] = useState(0);
  const [shipping, setShipping] = useState<Shipping>({ name: "", postalCode: "", address: "", phone: "" });
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("クレジットカード");
  const [comment, setComment] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const reward = available.find((r) => r.id === rewardId);
  if (!reward) return <p className="mt-8 text-stone-500">現在選べるリターンがありません。</p>;

  const isFree = reward.price === 0;
  // 在庫限定のリターンは1個ずつ
  const maxQuantity = isFree || reward.limit !== undefined ? 1 : 10;
  const total = reward.price * quantity + (isFree ? 0 : tip);
  const steps: FormStep[] = [
    "reward",
    ...(reward.requiresShipping ? (["shipping"] as const) : []),
    "payment",
    "confirm",
  ];
  const current = steps.indexOf(step as FormStep);

  const shippingErrors = Object.fromEntries(
    (Object.keys(SHIPPING_ERRORS) as (keyof Shipping)[]).map((k) => [k, SHIPPING_ERRORS[k](shipping[k])]),
  ) as Record<keyof Shipping, string | null>;
  const stepValid =
    step === "shipping"
      ? Object.values(shippingErrors).every((e) => e === null)
      : step === "payment"
        ? isEmail(email)
        : true;

  function next() {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(steps[current + 1] ?? "done");
    window.scrollTo({ top: 0 });
  }
  function back() {
    setShowErrors(false);
    setStep(steps[current - 1] ?? "reward");
  }

  if (step === "done") {
    return (
      <div className="mx-auto mt-8 max-w-xl space-y-6 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <div>
          <p className="text-2xl font-bold text-emerald-800">ご支援ありがとうございます！</p>
          <p className="mt-2 text-sm text-stone-600">
            {email} に確認メールをお送りしました。
            {fundingModel === "all_or_nothing" && !isFree && (
              <>
                <br />
                決済は、目標を達成した場合のみ募集終了後に行われます。
              </>
            )}
          </p>
        </div>
        <div className="bg-white p-4 text-left">
          <ShareButtons title={projectTitle} path={`/projects/${projectSlug}/`} />
          <p className="mt-2 text-xs text-stone-500">あなたのシェアが、次の支援者につながります。</p>
        </div>
        <div className="bg-white p-4 text-left text-sm">
          <p className="font-bold">パスワードを設定すると、マイページが使えます</p>
          <p className="mt-1 text-stone-600">支援内容の確認、活動報告の通知、実行者へのメッセージができるようになります。</p>
          <Link href="/login" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 font-medium text-white">
            パスワードを設定する
          </Link>
        </div>
        <Link href={`/projects/${projectSlug}`} className="inline-block text-sm text-stone-600 underline">
          プロジェクトに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <ol className="flex gap-2 text-xs" aria-label="支援の手順">
          {steps.map((s, i) => (
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

        {step === "reward" && (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-2 font-bold">リターンを選んでください</legend>
              {available.map((r) => (
                <label
                  key={r.id}
                  className={`flex cursor-pointer gap-3 border bg-white p-4 ${
                    r.id === rewardId ? "border-brand ring-1 ring-brand" : "border-stone-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="reward"
                    checked={r.id === rewardId}
                    onChange={() => {
                      setRewardId(r.id);
                      setQuantity(1);
                    }}
                    className="mt-1 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2 font-bold">
                      {r.title}
                      <span className="shrink-0">{r.price === 0 ? "0円" : formatYen(r.price)}</span>
                    </span>
                    <span className="mt-1 block text-sm text-stone-600">{r.description}</span>
                    <span className="mt-1 block text-xs text-stone-500">
                      {REWARD_KIND_LABELS[r.kind]}・お届け予定 {r.deliveryEstimate}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            {maxQuantity > 1 && (
              <label className="flex items-center gap-3 text-sm">
                数量
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="rounded border border-stone-300 bg-white px-2 py-1"
                >
                  {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
            {!isFree && (
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
                      className={`rounded-full border px-4 py-1.5 text-sm ${
                        tip === t ? "border-brand bg-brand text-white" : "border-stone-300 bg-white"
                      }`}
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
            <legend className="px-1 font-bold">お届け先</legend>
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
              <h2 className="font-bold">メールアドレス</h2>
              <p className="mt-1 text-xs text-stone-500">会員登録は不要です。支援の確認メールと、活動報告をお送りします。</p>
              <div className="mt-3">
                <Field label="メールアドレス" value={email} onChange={setEmail} autoComplete="email" type="email" error={showErrors && !isEmail(email) ? "メールアドレスを正しく入力してください" : null} />
              </div>
              <p className="mt-3 text-xs text-stone-500">
                すでにアカウントをお持ちの方は <Link href="/login" className="text-brand underline">ログイン</Link>
              </p>
            </section>

            {!isFree && (
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
                {/* TODO: Stripe Payment Element を埋め込む。
                    All-or-Nothing は SetupIntent でカードを保存し、目標達成後に請求する。
                    All-in は PaymentIntent でその場で決済する。 */}
                <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                  ここに{paymentMethod}の入力欄（Stripe）が入ります
                </div>
                <p className="flex items-center gap-2 text-xs text-stone-500">
                  <span aria-hidden>🔒</span>
                  通信は暗号化され、カード情報は当サイトに保存されません。
                </p>
              </section>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 border border-stone-200 bg-white p-5">
            <h2 className="font-bold">内容の確認</h2>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-3 text-sm">
              <dt className="text-stone-500">リターン</dt>
              <dd>
                {reward.title} × {quantity}
              </dd>
              {reward.requiresShipping && (
                <>
                  <dt className="text-stone-500">お届け先</dt>
                  <dd>
                    {shipping.name}
                    <br />〒{shipping.postalCode} {shipping.address}
                  </dd>
                </>
              )}
              <dt className="text-stone-500">メール</dt>
              <dd>{email}</dd>
              {!isFree && (
                <>
                  <dt className="text-stone-500">お支払い</dt>
                  <dd>{paymentMethod}</dd>
                </>
              )}
            </dl>
            <label className="block text-sm">
              応援コメント（任意・プロジェクトページに公開されます）
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="アーティストへのメッセージをどうぞ"
                className="mt-1 w-full rounded-lg border border-stone-300 p-2"
              />
            </label>
            <p className="text-xs text-stone-500">
              支援することで<Link href="/legal/terms" className="underline">利用規約</Link>と
              <Link href="/legal/tokushoho" className="underline">特定商取引法に基づく表記</Link>に同意したものとみなします。
            </p>
          </div>
        )}

        {/* スマホでは合計欄が下に回るので、ボタンの直前に合計を出す */}
        <p className="flex items-baseline justify-between rounded-lg bg-white px-4 py-3 text-sm lg:hidden">
          <span className="text-stone-600">合計（税込・送料込み）</span>
          <span className="text-xl font-bold">{formatYen(total)}</span>
        </p>

        <div className="flex gap-3">
          {step !== "reward" && (
            <button type="button" onClick={back} className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm">
              戻る
            </button>
          )}
          <button type="button" onClick={next} className="flex-1 rounded-full bg-brand py-3.5 font-bold text-white hover:bg-brand-dark">
            {step === "confirm" ? (isFree ? "参加する" : `${formatYen(total)}で支援する`) : "次へ"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 border border-stone-200 bg-white p-5 text-sm">
          <h2 className="font-bold">ご支援内容</h2>
          <div className="flex justify-between gap-2">
            <span className="text-stone-600">
              {reward.title}
              {quantity > 1 && ` × ${quantity}`}
            </span>
            <span className="shrink-0">{formatYen(reward.price * quantity)}</span>
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
            <span className="font-bold">合計（税込）</span>
            <span className="text-2xl font-bold">{formatYen(total)}</span>
          </div>
          <p className="text-xs text-stone-500">お届け予定：{reward.deliveryEstimate}</p>
          {fundingModel === "all_or_nothing" && !isFree && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              All-or-Nothing方式です。目標金額に届かなかった場合、お支払いは発生しません。
            </p>
          )}
        </div>
      </aside>
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
        required
        className={`mt-1 w-full rounded-lg border px-3 py-2.5 ${error ? "border-rose-400 bg-rose-50" : "border-stone-300"}`}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
