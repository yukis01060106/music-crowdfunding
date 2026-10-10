"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProofreadPanel } from "@/components/proofread/proofread-panel";
import { submitProject } from "@/lib/demo-store";
import { IS_DEMO } from "@/lib/site";
import { formatPrice, formatYen } from "@/lib/format";
import { MINOR_ARTIST_TYPES, REWARD_KIND_LABELS } from "@/types";
import { applyFix, checklist, clearDraft, initialDraft, loadDraft, proofreadFields, revokeFiles, saveDraft, storyText, TABS, toNumber, type Draft, type Tab } from "./draft";
import { Preview } from "./preview";
import { BasicsSection, IdentitySection, MediaSection, MoneySection, RewardsSection, RisksSection, StorySection, TracksSection, type Update } from "./sections";

/** 「視差効果を減らす」設定なら、スクロールのアニメーションをしない */
const scrollBehavior = (): ScrollBehavior => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

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
  const submitRef = useRef<HTMLButtonElement>(null);

  const update: Update = useCallback((fn) => setD((prev) => fn(prev)), []);

  // 前回の下書きを復元する（localStorage はブラウザでしか読めないので、描画後に）
  useEffect(() => {
    const saved = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 保存済みの下書きはブラウザでしか読めない
    if (saved) setD(saved);
    setRestored(saved !== null);
    loaded.current = true;
  }, []);

  // 画面を離れるときに、選んだファイルの一時 URL を解放する
  const latest = useRef(d);
  useEffect(() => {
    latest.current = d;
  });
  useEffect(() => () => revokeFiles(latest.current), []);

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
    topRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }

  if (submitted) {
    return (
      <div className="animate-rise mx-auto max-w-xl space-y-4 border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          📮
        </p>
        <p className="text-2xl font-bold text-emerald-800">審査に提出しました</p>
        <p className="text-sm leading-relaxed text-stone-600">
          審査の結果は、5営業日ほどを目安にメールでお知らせします。審査中は編集できません。
          <br />
          審査を通過したら、好きなタイミングで公開ボタンを押して募集を始められます。
        </p>
        <div className="flex flex-col items-center gap-2">
          {IS_DEMO && (
            <Link href="/admin/review" className="text-sm font-bold text-brand underline">
              （デモ）運営の審査画面で確認する
            </Link>
          )}
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
          <div className="animate-rise flex flex-wrap items-center justify-between gap-2 bg-brand-soft min-h-11 px-4 py-2 text-sm text-brand">
            前回の下書きを復元しました（画像と音源は選び直してください）。
            <button
              type="button"
              onClick={() => {
                clearDraft();
                revokeFiles(d);
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
                <span className="mr-1 font-en text-[10px] text-stone-500">{i + 1}</span>
                {t}
                {complete && (
                  <>
                    <span className="ml-1 text-emerald-700" aria-hidden>
                      ✓
                    </span>
                    <span className="sr-only">（入力済み）</span>
                  </>
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
            className={buttonClass("secondary", "md", "disabled:invisible")}
          >
            ← {TABS[tabIndex - 1]}
          </button>
          {tabIndex === TABS.length - 1 && (
            <button type="button" onClick={() => submitRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "center" })} className={buttonClass("dark", "md")}>
              チェックして審査に提出 ↓
            </button>
          )}
          {tabIndex < TABS.length - 1 && (
            <button type="button" onClick={() => go(TABS[tabIndex + 1])} className={buttonClass("dark", "md")}>
              {TABS[tabIndex + 1]} →
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-3 lg:self-start">
        {/* いちばん大事な操作（プレビュー・提出）は、欄の先頭に置いていつでも見えるようにする */}
        <div className="space-y-2 border-b border-stone-200 pb-3">
        <button type="button" onClick={() => setPreviewing(true)} className={buttonClass("secondary", "md", "w-full")}>
            プレビュー
          </button>
          <button
            ref={submitRef}
            type="button"
            disabled={!ready}
            onClick={() => {
              // TODO: Supabase に保存し、status を in_review にする
              submitProject({
                title: d.title,
                artist: "星空ラジオ",
                goal: d.goalType === "amount" ? formatYen(toNumber(d.goal)) : `参加 ${d.goal}人`,
                story: storyText(d).slice(0, 400),
                rewards: d.rewards.map((r) => `${formatPrice(r.kind === "free" ? 0 : toNumber(r.price))} ${r.title}（${REWARD_KIND_LABELS[r.kind]}）`),
                flags: { identity: d.identityVerified, cover: d.tracks.some((t) => t.isCover), minor: d.artistTypes.some((t) => MINOR_ARTIST_TYPES.includes(t)) },
              });
              clearDraft();
              setSubmitted(true);
              window.scrollTo({ top: 0, behavior: scrollBehavior() });
            }}
            className={buttonClass("primary", "lg", "w-full")}
          >
            審査に提出する
          </button>
          <p className="text-center text-xs text-stone-500">
            {ready ? "提出後は審査が終わるまで編集できません" : `必須の項目があと${required.length - doneCount}つあります`}
          </p>
          <p className="text-center text-[11px] text-stone-500" aria-live="polite">
            {savedAt ? `下書きを自動保存しました（${savedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}）` : "入力内容は自動で下書き保存されます"}
          </p>
        </div>
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
          <CheckList items={required} onJump={go} />
          <p className="mt-4 text-xs font-bold text-stone-500">あると支援されやすい</p>
          <CheckList items={recommended} onJump={go} />
        </div>

        <ProofreadPanel
          fields={proofreadFields(d)}
          onApply={(fieldId, excerpt, replacement) => update((prev) => applyFix(prev, fieldId, excerpt, replacement))}
          onJump={(fieldId) => go(tabOfField(fieldId))}
        />

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
            <span className={`transition ${c.done ? "scale-110 text-emerald-700" : "text-stone-300"}`} aria-hidden>
              {c.done ? "✓" : "○"}
            </span>
            <span className={c.done ? "text-stone-500 line-through decoration-stone-300" : ""}>{c.label}</span>
            <span className="sr-only">{c.done ? "（完了）" : "（未完了）"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
