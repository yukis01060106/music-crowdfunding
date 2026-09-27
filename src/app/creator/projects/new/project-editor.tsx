"use client";

import { useState } from "react";
import {
  ARTIST_TYPE_LABELS,
  FUNDING_MODEL_LABELS,
  GENRE_LABELS,
  MINOR_ARTIST_TYPES,
  REWARD_KIND_LABELS,
  type ArtistType,
  type FundingModel,
  type Genre,
  type GoalType,
  type RewardKind,
} from "@/types";

const TABS = ["基本情報", "ストーリー・試聴", "資金・スケジュール・リスク", "リターン", "本人確認・振込先"] as const;
type Tab = (typeof TABS)[number];

const TITLE_MAX = 40;

interface DraftReward {
  title: string;
  price: number;
  kind: RewardKind;
}

interface Draft {
  title: string;
  catchcopy: string;
  genre: Genre;
  fundingModel: FundingModel;
  goalType: GoalType;
  goal: string;
  days: string;
  artistTypes: ArtistType[];
  guardianConsent: boolean;
  summary: string;
  story: string;
  budget: string;
  schedule: string;
  risks: string;
  rewards: DraftReward[];
}

const initialDraft: Draft = {
  title: "",
  catchcopy: "",
  genre: "rock",
  fundingModel: "all_or_nothing",
  goalType: "amount",
  goal: "",
  days: "30",
  artistTypes: [],
  guardianConsent: false,
  summary: "",
  story: "",
  budget: "",
  schedule: "",
  risks: "",
  rewards: [
    { title: "0円で応援する", price: 0, kind: "free" },
    { title: "", price: 3000, kind: "digital" },
  ],
};

// TODO: 下書きを自動保存し、「審査に提出」で status を in_review にする
export function ProjectEditor() {
  const [tab, setTab] = useState<Tab>("基本情報");
  const [d, setD] = useState<Draft>(initialDraft);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));

  const needsGuardianConsent = d.artistTypes.some((t) => MINOR_ARTIST_TYPES.includes(t));
  const paidRewards = d.rewards.filter((r) => r.price > 0 && r.title.trim());

  // 支援者が支援を決めるのに必要な情報がそろっているか
  const checklist: { label: string; done: boolean; tab: Tab }[] = [
    { label: "タイトル", done: d.title.trim().length > 0 && d.title.length <= TITLE_MAX, tab: "基本情報" },
    { label: "目標と期間", done: Number(d.goal) > 0 && Number(d.days) >= 7 && Number(d.days) <= 80, tab: "基本情報" },
    { label: "アーティストタイプ", done: d.artistTypes.length > 0, tab: "基本情報" },
    ...(needsGuardianConsent ? [{ label: "保護者の同意", done: d.guardianConsent, tab: "基本情報" as Tab }] : []),
    { label: "実現すること（要約）", done: d.summary.trim().length > 0, tab: "ストーリー・試聴" },
    { label: "ストーリー", done: d.story.trim().length >= 200, tab: "ストーリー・試聴" },
    { label: "資金の使い道", done: d.budget.trim().length > 0, tab: "資金・スケジュール・リスク" },
    { label: "スケジュール", done: d.schedule.trim().length > 0, tab: "資金・スケジュール・リスク" },
    { label: "リスクとチャレンジ", done: d.risks.trim().length > 0, tab: "資金・スケジュール・リスク" },
    { label: "有料のリターン（1つ以上）", done: paidRewards.length > 0, tab: "リターン" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const ready = doneCount === checklist.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-4">
        <nav className="flex gap-1 overflow-x-auto border-b border-stone-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${
                t === tab ? "border-brand font-medium text-brand" : "border-transparent text-stone-500"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-5">
          {tab === "基本情報" && (
            <>
              <Field label="プロジェクトタイトル" hint={`${d.title.length}/${TITLE_MAX}文字。何をしたいかが一目でわかるように。`} error={d.title.length > TITLE_MAX ? `${TITLE_MAX}文字以内にしてください` : undefined}>
                <input value={d.title} onChange={(e) => set("title", e.target.value)} className={inputClass} placeholder="例: 結成7年目、初のフルアルバムを作りたい" />
              </Field>
              <Field label="キャッチコピー" hint="シェアされたときにも表示されます。">
                <input value={d.catchcopy} onChange={(e) => set("catchcopy", e.target.value)} className={inputClass} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="ジャンル">
                  <select value={d.genre} onChange={(e) => set("genre", e.target.value as Genre)} className={inputClass}>
                    {(Object.entries(GENRE_LABELS) as [Genre, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="達成方式" hint="迷ったらAll-or-Nothing。支援者が安心して支援できます。">
                  <select value={d.fundingModel} onChange={(e) => set("fundingModel", e.target.value as FundingModel)} className={inputClass}>
                    {(Object.entries(FUNDING_MODEL_LABELS) as [FundingModel, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="目標の種類">
                  <select value={d.goalType} onChange={(e) => set("goalType", e.target.value as GoalType)} className={inputClass}>
                    <option value="amount">金額</option>
                    <option value="participants">参加人数（0円プランの参加者も数える）</option>
                  </select>
                </Field>
                <Field label={d.goalType === "amount" ? "目標金額（円）" : "目標人数（人）"} hint="制作費・リターン原価・送料・手数料をすべて足した額に。">
                  <input type="number" min={1} value={d.goal} onChange={(e) => set("goal", e.target.value)} className={inputClass} />
                </Field>
                <Field label="募集期間（日）" hint="7〜80日。30〜45日がおすすめ。支援は最初と最後の2日間に集まります。">
                  <input type="number" min={7} max={80} value={d.days} onChange={(e) => set("days", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <fieldset className="text-sm">
                <legend className="font-medium">アーティストタイプ（複数選べます）</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.entries(ARTIST_TYPE_LABELS) as [ArtistType, string][]).map(([t, label]) => (
                    <label key={t} className="flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1">
                      <input
                        type="checkbox"
                        checked={d.artistTypes.includes(t)}
                        onChange={(e) =>
                          set("artistTypes", e.target.checked ? [...d.artistTypes, t] : d.artistTypes.filter((x) => x !== t))
                        }
                        className="accent-brand"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {needsGuardianConsent && (
                <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <p>18歳未満の方は、保護者の同意がないとプロジェクトを公開できません。</p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={d.guardianConsent} onChange={(e) => set("guardianConsent", e.target.checked)} className="accent-brand" />
                    保護者の同意を得ています（審査時に同意書を提出します）
                  </label>
                </div>
              )}
            </>
          )}

          {tab === "ストーリー・試聴" && (
            <>
              <Field label="メイン画像" hint="文字を入れすぎない、アーティストの顔が見える写真がおすすめです。">
                <input type="file" accept="image/*" className="block text-sm" />
              </Field>
              <Field label="このプロジェクトで実現すること（1行に1つ、3つまで）" hint="スマホではページの冒頭しか読まれません。ここだけで伝わるように。">
                <textarea rows={3} value={d.summary} onChange={(e) => set("summary", e.target.value)} className={inputClass} placeholder={"初のフルアルバムを制作\nCDとアナログ盤でリリース"} />
              </Field>
              <Field label="ストーリー" hint={`${d.story.length}文字（200文字以上）。なぜ今やるのか、あなたの想いを。支援の決め手の1位は「想いへの共感」です。`}>
                <textarea rows={10} value={d.story} onChange={(e) => set("story", e.target.value)} className={inputClass} />
              </Field>
              <Field label="試聴音源（MP3、1曲90秒まで）" hint="カバー曲を使う場合は、著作権の許諾が必要です。">
                <input type="file" accept="audio/*" multiple className="block text-sm" />
              </Field>
            </>
          )}

          {tab === "資金・スケジュール・リスク" && (
            <>
              <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
                支援者がいちばん不安なのは「本当に届くのか」です。ここを具体的に書くほど、支援されやすくなります。
              </p>
              <Field label="資金の使い道（1行に「項目: 金額」）">
                <textarea rows={4} value={d.budget} onChange={(e) => set("budget", e.target.value)} className={inputClass} placeholder={"スタジオ代: 450000\nプレス代: 400000"} />
              </Field>
              <Field label="スケジュール（1行に「時期: 内容」）">
                <textarea rows={4} value={d.schedule} onChange={(e) => set("schedule", e.target.value)} className={inputClass} placeholder={"2026年12月: レコーディング\n2027年2月: お届け"} />
              </Field>
              <Field label="リスクとチャレンジ" hint="遅れる可能性があること、そのときにどう知らせるかを正直に。">
                <textarea rows={4} value={d.risks} onChange={(e) => set("risks", e.target.value)} className={inputClass} />
              </Field>
            </>
          )}

          {tab === "リターン" && (
            <>
              <p className="text-sm text-stone-600">
                3〜5種類がおすすめ。主力は1,500〜3,000円。金額は<strong>税込・送料込み</strong>で入力してください。
              </p>
              {d.rewards.map((r, i) => (
                <div key={i} className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_120px_160px_auto]">
                  <input
                    value={r.title}
                    onChange={(e) => set("rewards", d.rewards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    placeholder="リターン名"
                    aria-label="リターン名"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    value={r.price}
                    onChange={(e) => set("rewards", d.rewards.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))}
                    aria-label="金額（税込・送料込み）"
                    className={inputClass}
                  />
                  <select
                    value={r.kind}
                    onChange={(e) => set("rewards", d.rewards.map((x, j) => (j === i ? { ...x, kind: e.target.value as RewardKind } : x)))}
                    aria-label="種類"
                    className={inputClass}
                  >
                    {(Object.entries(REWARD_KIND_LABELS) as [RewardKind, string][]).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => set("rewards", d.rewards.filter((_, j) => j !== i))}
                    className="rounded-lg px-3 text-sm text-stone-500 hover:bg-stone-100"
                    aria-label="このリターンを削除"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("rewards", [...d.rewards, { title: "", price: 5000, kind: "ticket" }])}
                className="rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm text-stone-600"
              >
                ＋ リターンを追加
              </button>
            </>
          )}

          {tab === "本人確認・振込先" && (
            <p className="text-sm text-stone-600">
              本人確認書類の提出と振込先口座の登録は、Stripe Connect の画面で行います（審査の提出に必須）。
              本人確認が済むと、プロジェクトページに「本人確認済み」のバッジが付きます。
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <p className="font-bold">公開までのチェック</p>
            <p className="text-xs text-stone-500">
              {doneCount}/{checklist.length}
            </p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-1.5">
            {checklist.map((c) => (
              <li key={c.label}>
                <button type="button" onClick={() => setTab(c.tab)} className="flex w-full items-center gap-2 text-left hover:text-brand">
                  <span className={c.done ? "text-emerald-600" : "text-stone-300"} aria-hidden>
                    {c.done ? "✓" : "○"}
                  </span>
                  <span className={c.done ? "text-stone-500" : ""}>{c.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="w-full rounded-lg border border-stone-300 bg-white py-2 text-sm">
          プレビュー
        </button>
        <button
          type="button"
          disabled={!ready}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-white disabled:bg-stone-300"
        >
          審査に提出する
        </button>
        {!ready && <p className="text-center text-xs text-stone-500">すべての項目がそろうと提出できます</p>}
      </aside>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>
      )}
    </label>
  );
}
