"use client";

import { useState } from "react";
import {
  FUNDING_MODEL_LABELS,
  GENRE_LABELS,
  REWARD_KIND_LABELS,
  type FundingModel,
  type Genre,
  type GoalType,
  type RewardKind,
} from "@/types";

const TABS = ["基本情報", "ストーリー・試聴音源", "リターン", "本人確認・振込先"] as const;
type Tab = (typeof TABS)[number];

interface DraftReward {
  title: string;
  price: number;
  kind: RewardKind;
}

// TODO: 下書きを自動保存し、「審査に提出」で status を in_review にする
export function ProjectEditor() {
  const [tab, setTab] = useState<Tab>("基本情報");
  const [goalType, setGoalType] = useState<GoalType>("amount");
  const [rewards, setRewards] = useState<DraftReward[]>([{ title: "0円で応援する", price: 0, kind: "free" }]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <div className="min-w-0 space-y-4">
        <nav className="flex flex-wrap gap-1 border-b border-stone-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                t === tab ? "border-brand font-medium text-brand" : "border-transparent text-stone-500"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          {tab === "基本情報" && (
            <>
              <Input label="プロジェクトタイトル（40文字以内）" maxLength={40} />
              <Input label="キャッチコピー" />
              <Select label="ジャンル" options={Object.entries(GENRE_LABELS) as [Genre, string][]} />
              <Select
                label="達成方式"
                options={Object.entries(FUNDING_MODEL_LABELS) as [FundingModel, string][]}
              />
              <label className="block text-sm">
                目標の種類
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as GoalType)}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                >
                  <option value="amount">金額</option>
                  <option value="participants">参加人数（0円プランの参加者も数える）</option>
                </select>
              </label>
              <Input label={goalType === "amount" ? "目標金額（円）" : "目標人数（人）"} type="number" />
              <Input label="募集期間（日数・7〜80日）" type="number" min={7} max={80} />
              <p className="text-xs text-stone-500">30〜45日間が支援を集めやすい期間です。</p>
            </>
          )}

          {tab === "ストーリー・試聴音源" && (
            <>
              <label className="block text-sm">
                メイン画像
                <input type="file" accept="image/*" className="mt-1 block text-sm" />
              </label>
              <label className="block text-sm">
                本文（なぜやるのか・資金の使い道・スケジュール）
                <textarea rows={10} className="mt-1 w-full rounded-lg border border-stone-300 p-3" />
              </label>
              <label className="block text-sm">
                試聴音源（MP3、1曲90秒まで）
                <input type="file" accept="audio/*" multiple className="mt-1 block text-sm" />
              </label>
              <p className="text-xs text-stone-500">
                カバー曲を試聴に使う場合は、著作権の許諾が必要です。
              </p>
            </>
          )}

          {tab === "リターン" && (
            <>
              {rewards.map((r, i) => (
                <div key={i} className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_120px_160px]">
                  <input
                    value={r.title}
                    onChange={(e) => setRewards(rewards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    placeholder="リターン名"
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={r.price}
                    onChange={(e) =>
                      setRewards(rewards.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    aria-label="金額"
                  />
                  <select
                    value={r.kind}
                    onChange={(e) =>
                      setRewards(rewards.map((x, j) => (j === i ? { ...x, kind: e.target.value as RewardKind } : x)))
                    }
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                    aria-label="種類"
                  >
                    {(Object.entries(REWARD_KIND_LABELS) as [RewardKind, string][]).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRewards([...rewards, { title: "", price: 3000, kind: "digital" }])}
                className="rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm text-stone-600"
              >
                ＋ リターンを追加
              </button>
            </>
          )}

          {tab === "本人確認・振込先" && (
            <p className="text-sm text-stone-600">
              本人確認書類の提出と振込先口座の登録は、Stripe Connect の画面で行います（審査の提出に必須）。
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <p className="font-bold">ステータス：作成中</p>
          <p className="mt-1 text-stone-500">必須項目をすべて入力すると提出できます。</p>
        </div>
        <button type="button" className="w-full rounded-lg border border-stone-300 bg-white py-2 text-sm">
          プレビュー
        </button>
        <button type="button" disabled className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-white disabled:bg-stone-300">
          審査に提出する
        </button>
      </aside>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      {label}
      <input {...props} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
    </label>
  );
}

function Select<T extends string>({ label, options }: { label: string; options: [T, string][] }) {
  return (
    <label className="block text-sm">
      {label}
      <select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
