"use client";

import Link from "next/link";
import { useState } from "react";
import type { FundingModel, Reward } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatYen } from "@/lib/format";

type Step = "reward" | "shipping" | "payment" | "confirm" | "done";

const STEP_LABELS: Record<Exclude<Step, "done">, string> = {
  reward: "リターン",
  shipping: "お届け先",
  payment: "お支払い",
  confirm: "確認",
};

interface Shipping {
  name: string;
  postalCode: string;
  address: string;
  phone: string;
}

export function SupportFlow({
  projectSlug,
  fundingModel,
  rewards,
  initialRewardId,
}: {
  projectSlug: string;
  fundingModel: FundingModel;
  rewards: Reward[];
  initialRewardId?: string;
}) {
  const available = rewards.filter((r) => r.limit === undefined || r.backers < r.limit);
  const [step, setStep] = useState<Step>("reward");
  const [rewardId, setRewardId] = useState(
    available.some((r) => r.id === initialRewardId) ? initialRewardId : available[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState<Shipping>({ name: "", postalCode: "", address: "", phone: "" });
  const [comment, setComment] = useState("");

  const reward = available.find((r) => r.id === rewardId);
  if (!reward) return <p className="mt-8 text-stone-500">現在選べるリターンがありません。</p>;

  const isFree = reward.price === 0;
  // 在庫限定のリターンは1個ずつ
  const maxQuantity = isFree || reward.limit !== undefined ? 1 : 10;
  const total = reward.price * quantity;
  const steps: Exclude<Step, "done">[] = [
    "reward",
    ...(reward.requiresShipping ? (["shipping"] as const) : []),
    ...(isFree ? [] : (["payment"] as const)),
    "confirm",
  ];
  const next = () => setStep(steps[steps.indexOf(step as Exclude<Step, "done">) + 1] ?? "done");
  const back = () => setStep(steps[steps.indexOf(step as Exclude<Step, "done">) - 1] ?? "reward");

  if (step === "done") {
    return (
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-2xl font-bold text-emerald-700">ご支援ありがとうございます！</p>
        <p className="mt-2 text-sm text-stone-600">確認メールをお送りしました。支援内容はマイページで確認できます。</p>
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <Link href="/mypage" className="rounded-lg bg-brand px-4 py-2 text-white">
            マイページへ
          </Link>
          <Link href={`/projects/${projectSlug}`} className="rounded-lg border border-stone-300 px-4 py-2">
            プロジェクトに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <ol className="flex gap-2 text-xs">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex-1 rounded-full py-1.5 text-center ${
              s === step ? "bg-brand text-white" : "bg-stone-200 text-stone-600"
            }`}
          >
            {i + 1}. {STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      {step === "reward" && (
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">リターンを選んでください</legend>
          {available.map((r) => (
            <label
              key={r.id}
              className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-4 ${
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
                <span className="flex justify-between font-bold">
                  {r.title}
                  <span>{r.price === 0 ? "0円" : formatYen(r.price)}</span>
                </span>
                <span className="mt-1 block text-sm text-stone-600">{r.description}</span>
                <span className="mt-1 block text-xs text-stone-500">
                  {REWARD_KIND_LABELS[r.kind]}・お届け予定 {r.deliveryEstimate}
                </span>
              </span>
            </label>
          ))}
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
        </fieldset>
      )}

      {step === "shipping" && (
        <fieldset className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
          <legend className="font-bold">お届け先</legend>
          <Field label="お名前" value={shipping.name} onChange={(name) => setShipping({ ...shipping, name })} autoComplete="name" />
          <Field label="郵便番号" value={shipping.postalCode} onChange={(postalCode) => setShipping({ ...shipping, postalCode })} autoComplete="postal-code" />
          <Field label="住所" value={shipping.address} onChange={(address) => setShipping({ ...shipping, address })} autoComplete="street-address" />
          <Field label="電話番号" value={shipping.phone} onChange={(phone) => setShipping({ ...shipping, phone })} autoComplete="tel" type="tel" />
        </fieldset>
      )}

      {step === "payment" && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-bold">お支払い方法</h2>
          {/* TODO: Stripe Payment Element を埋め込む。
              All-or-Nothing は SetupIntent でカードを保存し、目標達成後に請求する。
              All-in は PaymentIntent でその場で決済する。 */}
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            ここにカード入力欄（Stripe）が入ります
          </div>
          {fundingModel === "all_or_nothing" && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              このプロジェクトはAll-or-Nothing方式です。目標金額に達した場合のみ、募集終了後に決済されます。
            </p>
          )}
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-bold">内容の確認</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
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
            <dt className="text-stone-500">合計</dt>
            <dd className="text-lg font-bold">{isFree ? "0円" : formatYen(total)}</dd>
          </dl>
          <label className="block text-sm">
            応援コメント（任意・プロジェクトページに公開されます）
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-stone-300 p-2"
            />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        {step !== "reward" && (
          <button type="button" onClick={back} className="rounded-lg border border-stone-300 px-5 py-3 text-sm">
            戻る
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={step === "shipping" && Object.values(shipping).some((v) => v.trim() === "")}
          className="flex-1 rounded-lg bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:bg-stone-300"
        >
          {step === "confirm" ? (isFree ? "参加する" : `${formatYen(total)}で支援する`) : "次へ"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
      />
    </label>
  );
}
