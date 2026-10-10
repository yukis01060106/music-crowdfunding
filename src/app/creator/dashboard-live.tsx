"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { own, useDemo, useHydrated } from "@/lib/demo-store";
import { useAdmin } from "@/lib/admin-store";
import { liveTotals, payableRaised, payoutIfReached, useNewBackings } from "@/lib/backing-state";
import { formatDate, formatYen, jstDateKey, progressPercent } from "@/lib/format";
import { payoutAmount } from "@/lib/fees";
import { useNow } from "@/lib/use-now";
import { tagClass } from "@/components/ui/tag";
import { CountUp } from "@/components/motion/count-up";
import { ProgressBar } from "@/components/project/progress";
import { CREATOR_PROJECT_SLUG } from "./creator-context";
import { SAMPLE_THREADS } from "./messages/inbox";
import { SHIPMENTS } from "./shipping/shipment-table";
import { UpdateReminder } from "./update-reminder";
import { SupportChart } from "./support-chart";

/** 未返信のメッセージの数（受信箱と同じ基準：最後のメッセージが支援者からのもの） */
export function useUnrepliedCount(): number {
  const { threads, sampleReplies } = useDemo();
  const live = threads.filter((t) => t.projectSlug === CREATOR_PROJECT_SLUG && t.messages.at(-1)?.from === "me").length;
  const samples = SAMPLE_THREADS.filter((t) => !(own(sampleReplies, t.id)?.length) && t.messages.at(-1)?.from === "backer").length;
  return live + samples;
}

/** 発送待ちの数（発送の画面と同じ基準：配送が必要なリターンで、返金しておらず、まだ発送していないもの。お届け先未入力も含む） */
export function usePendingShipments(shippingRewardIds: string[]): number {
  const { shipped } = useDemo();
  const now = useNow();
  const mine = useNewBackings(CREATOR_PROJECT_SLUG, now).filter((b) => shippingRewardIds.includes(b.rewardId) && !b.refunded && !own(shipped, b.id));
  return mine.length + SHIPMENTS.filter((s) => !own(shipped, s.id)).length;
}

/**
 * 実行者のダッシュボードの「やること」。支援者のメッセージ・発送・活動報告・運営からの知らせの状況から数える。
 * デモでは、このブラウザの支援者・運営の操作がそのまま反映される
 */
export function CreatorTodos({ lastSampleUpdate, shippingRewardIds }: { lastSampleUpdate?: string; shippingRewardIds: string[] }) {
  const { postedUpdates } = useDemo();
  const admin = useAdmin();
  const hydrated = useHydrated();
  const now = useNow();
  const unreplied = useUnrepliedCount();
  const pendingShipments = usePendingShipments(shippingRewardIds);
  const refunded = useNewBackings(CREATOR_PROJECT_SLUG, now).filter((b) => b.refunded).length;
  const suspended = own(admin.suspendedProjects, CREATOR_PROJECT_SLUG);
  if (!hydrated) return <div className="h-40 animate-pulse bg-stone-100" aria-label="読み込み中" />;
  const lastPosted = postedUpdates.find((u) => u.projectSlug === CREATOR_PROJECT_SLUG)?.publishedAt;
  const lastAt = [lastPosted, lastSampleUpdate].filter((x): x is string => Boolean(x)).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1);
  const todos = [
    ...(suspended ? [{ label: `運営がプロジェクトの掲載を停止しました（理由：${suspended}）。お問い合わせから運営に連絡してください`, href: "/contact", tone: "bg-rose-600", done: false }] : []),
    ...(refunded > 0 ? [{ label: `返金された支援が${refunded}件あります。発送の前に確かめてください`, href: "/creator/shipping", tone: "bg-rose-600", done: false }] : []),
    { label: unreplied > 0 ? `未返信のメッセージが${unreplied}件あります` : "未返信のメッセージはありません", href: "/creator/messages", tone: "bg-pop-pink", done: unreplied === 0 },
    { label: pendingShipments > 0 ? `発送待ちのリターンが${pendingShipments}件あります` : "発送待ちのリターンはありません", href: "/creator/shipping", tone: "bg-pop-yellow", done: pendingShipments === 0 },
    { label: <UpdateReminder lastAt={lastAt} />, href: "/creator/updates", tone: "bg-pop-teal", done: false },
  ];
  return (
    <ul data-stagger className="space-y-2">
      {todos.map((t, i) => (
        <li key={`${t.href}-${i}`}>
          <Link href={t.href} className="group flex min-h-11 items-center gap-3 border border-stone-200 bg-white p-3 text-sm transition hover:border-brand">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.done ? "bg-stone-300" : t.tone}`} aria-hidden />
            <span className={`flex-1 ${t.done ? "text-stone-500" : ""}`}>{t.label}</span>
            <span className="text-stone-500 transition-transform group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** プロジェクトの状態のタグ。運営が掲載を停止していれば「掲載停止中」 */
export function CreatorStatusTag({ slug, label, className }: { slug: string; label: string; className: string }) {
  const { suspendedProjects } = useAdmin();
  return own(suspendedProjects, slug) ? <span className={tagClass("danger")}>掲載停止中</span> : <span className={className}>{label}</span>;
}

/**
 * プロジェクトの数字。見本の数字に、このブラウザの有効な支援（返金を除く）を足す。
 * 達成率は公開ページと同じ式で出し、受け取り額は All-or-Nothing で目標に届いていなければ 0 にする
 */
export function CreatorProjectKpis({ project }: { project: Project }) {
  const now = useNow();
  const added = useNewBackings(project.slug, now).filter((b) => !b.refunded);
  const live = liveTotals(project, added);
  const percent = progressPercent(live);
  const payable = payableRaised(live, percent);
  const aon = project.fundingModel === "all_or_nothing";
  return (
    <>
      <div data-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi label="支援総額" value={<CountUp value={live.raised} format="yen" />} />
        <Kpi label="達成率" value={<><CountUp value={percent} />%</>} />
        <Kpi label="支援者" value={<><CountUp value={live.backers} />人</>} />
      </div>
      <ProgressBar project={live} />
      {added.length > 0 && (
        <p className="text-xs text-stone-600">
          <span className={tagClass("brand", "mr-1")}>新しい支援</span>
          このブラウザからの支援 {added.length}件（{formatYen(added.reduce((s, b) => s + b.amount, 0))}）を含みます。
        </p>
      )}
      <p className="text-xs text-stone-500">
        いま終了した場合の受け取り額：<span className="font-bold text-ink">{formatYen(payoutAmount(payable))}</span>
        {aon && percent < 100 && (
          <>
            （All-or-Nothing のため、目標に届かなければ受け取りはありません。目標を達成した場合は {formatYen(payoutIfReached(live, payoutAmount))} 以上）
          </>
        )}
      </p>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-stone-50 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="font-en text-lg font-black">{value}</p>
    </div>
  );
}

const DECISION = {
  pending: { label: "審査中", tone: "warning" },
  approved: { label: "承認されました", tone: "success" },
  rejected: { label: "差し戻されました", tone: "danger" },
} as const;

/** 審査に出したプロジェクトと、運営の審査の結果（運営の画面での承認・差し戻しが、ここに届く） */
export function SubmissionList() {
  const { submissions } = useDemo();
  const { reviewDecisions } = useAdmin();
  const hydrated = useHydrated();
  if (!hydrated || submissions.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-bold text-stone-500">審査に出したプロジェクト</h2>
      <ul className="space-y-2">
        {submissions.map((s) => {
          const d = own(reviewDecisions, s.id);
          const state = DECISION[d?.decision ?? "pending"];
          return (
            <li key={s.id} className="border border-stone-200 bg-white p-4 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <span className={tagClass(state.tone)}>{state.label}</span>
                <span className="font-bold">{s.title || "（タイトル未入力）"}</span>
                <span className="text-xs text-stone-500">{formatDate(s.submittedAt)} 提出</span>
              </p>
              {d?.decision === "rejected" && d.note && (
                <p className="mt-2 border-l-4 border-rose-300 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-900">
                  運営からのコメント：{d.note}
                  <Link href="/creator/projects/new" className="ml-2 font-bold underline">
                    直して出し直す
                  </Link>
                </p>
              )}
              {d?.decision === "approved" && <p className="mt-2 text-xs text-stone-600">審査を通過しました。本番では、ここに公開ボタンが出ます（デモ版のため、公開ページは作られません）。</p>}
              {!d && <p className="mt-2 text-xs text-stone-500">審査の結果は、5営業日ほどを目安にお知らせします。</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 残りの日数。掲載停止中は「受付停止中」 */
export function CreatorRemaining({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { suspendedProjects } = useAdmin();
  return own(suspendedProjects, slug) ? <span className="font-bold text-rose-700">掲載停止中のため、支援の受付を止めています</span> : <>{children}</>;
}

const CHART_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 日ごとの支援額。見本の配分（公開直後に多く、中だるみしてまた増える）に、このブラウザの支援を足す。
 * 期間は直近14日（募集が終わっていれば最後の14日）。
 * TODO（本番）: 支援のテーブルから日別に集計する
 */
export function CreatorSupportChart({ project }: { project: Project }) {
  const now = useNow();
  const added = useNewBackings(project.slug, now).filter((b) => !b.refunded);
  const start = Date.parse(project.startAt);
  const end = Math.min(now ?? start + (CHART_DAYS - 1) * DAY_MS, Date.parse(project.endAt));
  const totalDays = Math.max(1, Math.floor((Date.parse(project.endAt) - start) / DAY_MS) + 1);
  const weight = (i: number) => 1 + 3 * Math.exp(-i / 2) + ((i * 7) % 5) / 4 + (i > totalDays - 6 ? 2 : 0);
  const weightSum = Array.from({ length: totalDays }, (_, i) => weight(i)).reduce((a, b) => a + b, 0);
  const data = Array.from({ length: CHART_DAYS }, (_, k) => {
    const t = end - (CHART_DAYS - 1 - k) * DAY_MS;
    const i = Math.floor((t - start) / DAY_MS);
    const key = jstDateKey(new Date(t));
    const sample = i >= 0 ? Math.round(((project.raised * 0.9) / weightSum) * weight(i) / 100) * 100 : 0;
    const mine = added.filter((b) => jstDateKey(new Date(b.backedAt)) === key).reduce((s, b) => s + b.amount, 0);
    return { date: key, amount: sample + mine };
  });
  const ended = now !== null && now > Date.parse(project.endAt);
  return <SupportChart data={data} title={`日ごとの支援額（${ended ? "募集の最後の" : "直近"}${CHART_DAYS}日間）`} />;
}
