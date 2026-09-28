"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProofreadPanel } from "@/components/proofread/proofread-panel";
import { submitProject } from "@/lib/demo-store";
import { formatYen } from "@/lib/format";
import { MINOR_ARTIST_TYPES, REWARD_KIND_LABELS } from "@/types";
import { applyFix, checklist, clearDraft, initialDraft, loadDraft, proofreadFields, saveDraft, storyText, TABS, toNumber, type Draft, type Tab } from "./draft";
import { Preview } from "./preview";
import { BasicsSection, IdentitySection, MediaSection, MoneySection, RewardsSection, RisksSection, StorySection, TracksSection, type Update } from "./sections";

/** 入力が止まってから自動保存するまでの時間 */
const AUTOSAVE_MS = 1500;

/** 校正の指摘から、その欄があるタブを探す */
function tabOfField(fieldId: string): Tab {
  const kind = fieldId.split(":")[0];
  if (kind === "title" || kind === "catchcopy") return "基本情報";
  if (kind === "summary" || kind === "story") return "ストーリー";
  if (kind === "budget" || kind === "schedule") return "資金・スケジュール";
  if (kind === "reward") return "リターン";
  return "リスク・FAQ";
}

// TODO: Supabase に保存し、「審査に提出」で status を in_review にする
export function ProjectEditor() {
  const [tab, setTab] = useState<Tab>("基本情報");
  const [d, setD] = useState<Draft>(initialDraft);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [restored, setRestored] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const loaded = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  const update: Update = useCallback((fn) => setD((prev) => fn(prev)), []);

  // 前回の下書きを復元する（localStorage はブラウザでしか読めないので、描画後に）
  useEffect(() => {
    const saved = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 保存済みの下書きはブラウザでしか読めない
    if (saved) setD(saved);
    setRestored(saved !== null);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => saveDraft(d) && setSavedAt(new Date()), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [d]);

  const items = checklist(d);
  const required = items.filter((c) => c.required);
  const recommended = items.filter((c) => !c.required);
  const doneCount = required.filter((c) => c.done).length;
  const ready = doneCount === required.length;
  const tabIndex = TABS.indexOf(tab);

  function go(next: Tab) {
    setTab(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (submitted) {
    return (
      <div className="animate-rise mx-auto max-w-xl space-y-4 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          📮
        </p>
        <p className="text-2xl font-bold text-emerald-800">審査に提出しました</p>
        <p className="text-sm leading-relaxed text-stone-600">
          最短即日〜5営業日で結果をメールでお知らせします。審査中は編集できません。
          <br />
          審査を通過したら、好きなタイミングで公開ボタンを押して募集を始められます。
        </p>
        <div className="flex flex-col items-center gap-2">
          <Link href="/admin" className="text-sm font-bold text-brand underline">
            （デモ）運営の審査画面で確認する
          </Link>
          <button type="button" onClick={() => setSubmitted(false)} className="text-sm text-stone-500 underline">
            （デモ）編集画面に戻る
          </button>
        </div>
      </div>
    );
  }

  const sectionProps = { d, update };

  return (
    <div ref={topRef} className="grid scroll-mt-20 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-4">
        {restored && (
          <div className="animate-rise flex flex-wrap items-center justify-between gap-2 bg-brand-soft px-4 py-2 text-sm text-brand">
            前回の下書きを復元しました（画像と音源は選び直してください）。
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setD(initialDraft);
                setRestored(false);
              }}
              className="text-xs underline"
            >
              最初から作り直す
            </button>
          </div>
        )}

        <nav className="-mx-1 flex gap-x-1 overflow-x-auto border-b border-stone-200 px-1 lg:flex-wrap lg:overflow-visible" aria-label="入力項目">
          {TABS.map((t, i) => {
            const tabItems = required.filter((c) => c.tab === t);
            const complete = tabItems.length > 0 && tabItems.every((c) => c.done);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={t === tab ? "page" : undefined}
                className={`relative -mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${
                  t === tab ? "border-brand font-bold text-brand" : "border-transparent text-stone-500 hover:text-ink"
                }`}
              >
                <span className="mr-1 font-en text-[10px] text-stone-400">{i + 1}</span>
                {t}
                {complete && (
                  <span className="ml-1 text-emerald-500" aria-label="入力済み">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div key={tab} className="animate-rise space-y-5 border border-stone-200 bg-white p-5">
          {tab === "基本情報" && <BasicsSection {...sectionProps} />}
          {tab === "写真・動画" && <MediaSection {...sectionProps} />}
          {tab === "ストーリー" && <StorySection {...sectionProps} />}
          {tab === "試聴音源" && <TracksSection {...sectionProps} />}
          {tab === "資金・スケジュール" && <MoneySection {...sectionProps} />}
          {tab === "リターン" && <RewardsSection {...sectionProps} />}
          {tab === "リスク・FAQ" && <RisksSection {...sectionProps} />}
          {tab === "本人確認・振込先" && <IdentitySection {...sectionProps} />}
        </div>

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={() => go(TABS[tabIndex - 1])}
            disabled={tabIndex === 0}
            className="border border-stone-300 bg-white px-5 py-2.5 text-sm transition hover:bg-stone-100 disabled:invisible"
          >
            ← {TABS[tabIndex - 1]}
          </button>
          {tabIndex < TABS.length - 1 && (
            <button type="button" onClick={() => go(TABS[tabIndex + 1])} className="bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand">
              {TABS[tabIndex + 1]} →
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <div className="border border-stone-200 bg-white p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <p className="font-bold">公開までのチェック</p>
            <p className="font-en text-xs text-stone-500">
              {doneCount}/{required.length}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand transition-all duration-700 ease-out" style={{ width: `${(doneCount / required.length) * 100}%` }} />
          </div>
          <CheckList items={required} onJump={setTab} />
          <p className="mt-4 text-xs font-bold text-stone-500">あると支援されやすい</p>
          <CheckList items={recommended} onJump={setTab} />
        </div>

        <ProofreadPanel
          fields={proofreadFields(d)}
          onApply={(fieldId, excerpt, replacement) => update((prev) => applyFix(prev, fieldId, excerpt, replacement))}
          onJump={(fieldId) => setTab(tabOfField(fieldId))}
        />

        <button type="button" onClick={() => setPreviewing(true)} className="w-full border-2 border-ink bg-white py-2.5 text-sm font-bold transition hover:bg-ink hover:text-white">
          プレビュー
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            // TODO: Supabase に保存し、status を in_review にする
            submitProject({
              title: d.title,
              artist: "星空ラジオ",
              goal: d.goalType === "amount" ? formatYen(toNumber(d.goal)) : `参加 ${d.goal}人`,
              story: storyText(d).slice(0, 400),
              rewards: d.rewards.map((r) => `${r.kind === "free" ? "¥0" : formatYen(toNumber(r.price))} ${r.title}（${REWARD_KIND_LABELS[r.kind]}）`),
              flags: { identity: d.identityVerified, cover: d.tracks.some((t) => t.isCover), minor: d.artistTypes.some((t) => MINOR_ARTIST_TYPES.includes(t)) },
            });
            clearDraft();
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="w-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:bg-stone-300"
        >
          審査に提出する
        </button>
        <p className="text-center text-xs text-stone-500">
          {ready ? "提出後は審査が終わるまで編集できません" : `必須の項目があと${required.length - doneCount}つあります`}
        </p>
        <p className="text-center text-[11px] text-stone-400" aria-live="polite">
          {savedAt ? `下書きを自動保存しました（${savedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}）` : "入力内容は自動で下書き保存されます"}
        </p>
      </aside>

      {previewing && <Preview d={d} onClose={() => setPreviewing(false)} />}
    </div>
  );
}

function CheckList({ items, onJump }: { items: ReturnType<typeof checklist>; onJump: (tab: Tab) => void }) {
  return (
    <ul className="mt-2 space-y-1">
      {items.map((c) => (
        <li key={c.label}>
          <button type="button" onClick={() => onJump(c.tab)} className="flex w-full items-center gap-2 text-left transition hover:text-brand">
            <span className={`transition ${c.done ? "scale-110 text-emerald-600" : "text-stone-300"}`} aria-hidden>
              {c.done ? "✓" : "○"}
            </span>
            <span className={c.done ? "text-stone-400 line-through decoration-stone-300" : ""}>{c.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
