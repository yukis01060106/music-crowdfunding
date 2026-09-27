"use client";

import { useState } from "react";
import type { Membership, MembershipPlan } from "@/types";
import { formatYen } from "@/lib/format";
import { PLATFORM_FEE_RATE } from "@/lib/fees";
import { MEMBER_COMMON_PERKS } from "@/lib/membership";
import { PlanCard, mostPopularPlanId } from "@/components/membership/plan-card";
import { ProofreadPanel } from "@/components/proofread/proofread-panel";
import { AddButton, Field, inputClass, move, RowActions } from "../projects/new/editor-ui";

/** 月額の下限と上限。下限は決済手数料で赤字にならない額 */
const PRICE_MIN = 300;
const PRICE_MAX = 10_000;
const PLAN_MAX = 5;

interface DraftPlan {
  id: string;
  name: string;
  price: string;
  perks: string;
  limit: string;
  members: number;
}

const toDraft = (p: MembershipPlan): DraftPlan => ({ id: p.id, name: p.name, price: String(p.price), perks: p.perks.join("\n"), limit: p.limit ? String(p.limit) : "", members: p.members });

const toPlan = (p: DraftPlan): MembershipPlan => ({
  id: p.id,
  name: p.name || "（プラン名）",
  price: Number(p.price) || 0,
  perks: p.perks.split("\n").map((s) => s.trim()).filter(Boolean),
  limit: p.limit ? Number(p.limit) : undefined,
  members: p.members,
});

function planErrors(p: DraftPlan): string[] {
  const errors: string[] = [];
  if (!p.name.trim()) errors.push("プラン名を入力してください");
  const price = Number(p.price);
  if (!(price >= PRICE_MIN && price <= PRICE_MAX)) errors.push(`月額は${formatYen(PRICE_MIN)}〜${formatYen(PRICE_MAX)}にしてください`);
  if (!p.perks.trim()) errors.push("特典を1つ以上入力してください");
  return errors;
}

// TODO: Supabase に保存し、Stripe の Product / Price を作る（価格を変えたら新しい Price を作り、既存メンバーは据え置き）
export function MembershipEditor({ artistId, artistName, initial }: { artistId: string; artistName: string; initial?: Membership }) {
  const [enabled, setEnabled] = useState(initial !== undefined);
  const [message, setMessage] = useState(initial?.message ?? "");
  const [plans, setPlans] = useState<DraftPlan[]>(initial?.plans.map(toDraft) ?? [{ id: "m-1", name: "", price: "500", perks: "", limit: "", members: 0 }]);
  const [simMembers, setSimMembers] = useState(100);
  const [saved, setSaved] = useState(false);

  const setPlan = (id: string, patch: Partial<DraftPlan>) => {
    setSaved(false);
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const valid = message.trim().length > 0 && plans.every((p) => planErrors(p).length === 0);
  const preview = plans.map(toPlan);
  const popularId = mostPopularPlanId(preview);
  const cheapest = Math.min(...preview.map((p) => p.price).filter((n) => n > 0));
  const monthly = Number.isFinite(cheapest) ? Math.floor(cheapest * simMembers * (1 - PLATFORM_FEE_RATE)) : 0;

  const fields = [
    { id: "message", label: "メンバーへのひとこと", text: message },
    ...plans.flatMap((p) => [
      { id: `plan:${p.id}:name`, label: `プラン「${p.name}」の名前`, text: p.name },
      { id: `plan:${p.id}:perks`, label: `プラン「${p.name}」の特典`, text: p.perks },
    ]),
  ].filter((f) => f.text.trim());

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <label className="flex cursor-pointer items-center justify-between gap-4 border border-stone-200 bg-white p-5">
          <span>
            <span className="block font-bold">メンバーシップを開設する</span>
            <span className="mt-1 block text-xs text-stone-500">オンにすると、{artistName}のページに月額プランが表示されます。</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-brand" : "bg-stone-300"}`}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only" />
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
          </span>
        </label>

        {enabled && (
          <>
            <section className="animate-rise space-y-5 border border-stone-200 bg-white p-5">
              <Field label="メンバーへのひとこと" hint="加入ページの冒頭に表示されます。どんな毎月を一緒に過ごしたいかを短く。">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className={inputClass} placeholder="例: ライブのない月も、毎月いっしょに。新曲はまずメンバーに届けます。" />
              </Field>
              <div className="bg-brand-soft p-4 text-sm">
                <p className="font-bold text-brand">どのプランにも自動で付く、OTOFUND共通の特典</p>
                <ul className="mt-2 space-y-1 text-stone-700">
                  {MEMBER_COMMON_PERKS.map((p) => (
                    <li key={p.title}>✓ {p.title}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-bold">プラン</h2>
                <p className="text-xs text-stone-500">
                  {plans.length}/{PLAN_MAX}・2〜3プランがおすすめ
                </p>
              </div>
              {plans.map((p, i) => {
                const errors = planErrors(p);
                return (
                  <div key={p.id} className="animate-rise space-y-4 border border-stone-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-en text-sm font-black text-brand">PLAN {i + 1}</span>
                      <RowActions index={i} length={plans.length} onMove={(from, to) => setPlans(move(plans, from, to))} onRemove={plans.length > 1 && p.members === 0 ? () => setPlans(plans.filter((x) => x.id !== p.id)) : undefined} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_140px_120px]">
                      <Field label="プラン名">
                        <input value={p.name} onChange={(e) => setPlan(p.id, { name: e.target.value })} className={inputClass} placeholder="例: リスナー" />
                      </Field>
                      <Field label="月額（税込）">
                        <input type="number" inputMode="numeric" min={PRICE_MIN} max={PRICE_MAX} step={50} value={p.price} onChange={(e) => setPlan(p.id, { price: e.target.value })} className={`${inputClass} text-right`} />
                      </Field>
                      <Field label="人数限定" optional>
                        <input type="number" inputMode="numeric" min={1} value={p.limit} onChange={(e) => setPlan(p.id, { limit: e.target.value })} className={`${inputClass} text-right`} placeholder="無制限" />
                      </Field>
                    </div>
                    <Field label="特典（1行に1つ）" hint="「毎月」「月1回」など、どのくらいの頻度で届くかを書くと選ばれやすくなります。">
                      <textarea value={p.perks} onChange={(e) => setPlan(p.id, { perks: e.target.value })} rows={3} className={inputClass} placeholder={"メンバー限定の活動報告\n月1回のデモ音源"} />
                    </Field>
                    {p.members > 0 && <p className="text-xs text-stone-500">いまのメンバー {p.members}人。価格を変えても、いまのメンバーは元の価格のままです。</p>}
                    {errors.length > 0 && (
                      <ul className="text-xs text-rose-600">
                        {errors.map((e) => (
                          <li key={e}>・{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {plans.length < PLAN_MAX && (
                <AddButton onClick={() => setPlans([...plans, { id: `m-${Date.now()}`, name: "", price: "1000", perks: "", limit: "", members: 0 }])}>＋ プランを追加</AddButton>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-bold">プレビュー</h2>
              <div className="grid gap-6 bg-stone-50 p-6 sm:grid-cols-2 xl:grid-cols-3">
                {preview.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} artistId={artistId} popular={plan.id === popularId} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        {enabled && (
          <div className="border border-stone-200 bg-white p-4 text-sm">
            <p className="font-bold">毎月の収入の目安</p>
            <label className="mt-3 block text-xs text-stone-500">
              いちばん安いプランのメンバーが <span className="font-en text-base font-black text-ink">{simMembers}</span> 人なら
              <input type="range" min={10} max={3000} step={10} value={simMembers} onChange={(e) => setSimMembers(Number(e.target.value))} className="mt-2 w-full accent-brand" />
            </label>
            <p className="mt-2 font-en text-3xl font-black text-brand">{formatYen(monthly)}</p>
            <p className="text-xs text-stone-500">/ 月（手数料{PLATFORM_FEE_RATE * 100}%を引いた額）</p>
          </div>
        )}
        {enabled && (
          <ProofreadPanel
            fields={fields}
            onApply={(fieldId, excerpt, replacement) => {
              if (fieldId === "message") setMessage((m) => m.replace(excerpt, replacement));
              const [, id, prop] = fieldId.split(":");
              if (prop === "name" || prop === "perks") setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [prop]: p[prop].replace(excerpt, replacement) } : p)));
            }}
          />
        )}
        <button
          type="button"
          disabled={enabled && !valid}
          onClick={() => setSaved(true)}
          className="w-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:bg-stone-300"
        >
          {saved ? "✓ 保存しました" : "保存する"}
        </button>
        {enabled && !valid && <p className="text-center text-xs text-stone-500">ひとことと、各プランの必須項目を入力してください</p>}
        <p className="text-xs leading-relaxed text-stone-500">
          18歳未満のアーティストは、保護者の同意があっても現在メンバーシップを開設できません（継続課金のため）。
        </p>
      </aside>
    </div>
  );
}
