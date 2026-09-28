import Link from "next/link";
import { getArtist, getCreatorProjects } from "@/lib/data";
import { formatDate, formatNumber, formatYen, progressPercent } from "@/lib/format";
import { payoutAmount } from "@/lib/fees";
import { totalMembers } from "@/lib/membership";
import { PageTitle } from "@/components/side-nav";
import { ProgressBar } from "@/components/project/progress";
import { DaysLeft } from "@/components/project/days-left";
import { CountUp } from "@/components/motion/count-up";
import { STATUS_LABELS } from "./project-status";
import { SupportChart, type DailyPoint } from "./support-chart";

// TODO: 認証を入れたら、ログイン中のアーティストに差し替える
const CURRENT_ARTIST_ID = "hoshizora-radio";
const CHART_DAYS = 14;

/**
 * 日ごとの支援額（モック）。クラファンは公開直後と終了間際に支援が集まるので、
 * 支援総額を「最初に多く、中だるみして、また増える」形に配分する。
 * TODO: 支援のテーブルから日別に集計する
 */
function dailySupport(raised: number, startAt: string): DailyPoint[] {
  const weights = Array.from({ length: CHART_DAYS }, (_, i) => 1 + 3 * Math.exp(-i / 2) + ((i * 7) % 5) / 4);
  const sum = weights.reduce((a, b) => a + b, 0);
  const start = new Date(startAt);
  return weights.map((w, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10), amount: Math.round(((raised * 0.6) / sum) * w / 100) * 100 };
  });
}

export default async function CreatorDashboardPage() {
  const [projects, artist] = await Promise.all([getCreatorProjects(), getArtist(CURRENT_ARTIST_ID)]);
  const membershipMonthly = artist?.membership?.plans.reduce((sum, p) => sum + p.price * p.members, 0) ?? 0;

  // TODO: 未返信・未発送・活動報告の日付は、それぞれのテーブルから数える
  const todos = [
    { label: "未返信のメッセージが2件あります", href: "/creator/messages", tone: "bg-pop-pink" },
    { label: "発送待ちのリターンが2件あります", href: "/creator/shipping", tone: "bg-pop-yellow" },
    { label: "最後の活動報告から8日たちました。近況を伝えましょう", href: "/creator/updates", tone: "bg-pop-teal" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle>ダッシュボード</PageTitle>
        <Link href="/creator/projects/new" className="bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark">
          ＋ 新しいプロジェクト
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-stone-500">やること</h2>
        <ul data-stagger className="space-y-2">
          {todos.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="group flex items-center gap-3 border border-stone-200 bg-white p-3 text-sm transition hover:border-brand">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.tone}`} aria-hidden />
                <span className="flex-1">{t.label}</span>
                <span className="text-stone-400 transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {projects.map((p) => {
        const status = STATUS_LABELS[p.status];
        return (
          <section key={p.slug} className="space-y-5 border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
              <Link href={`/projects/${p.slug}`} className="font-bold hover:text-brand">
                {p.title}
              </Link>
              <span className="text-xs text-stone-500">{formatDate(p.endAt)}まで</span>
            </div>
            <div data-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="支援総額" value={<CountUp value={p.raised} format="yen" />} />
              <Kpi label="達成率" value={<><CountUp value={progressPercent(p)} />%</>} />
              <Kpi label="支援者" value={<><CountUp value={p.backers} />人</>} />
              <Kpi label="残り" value={<DaysLeft endAt={p.endAt} />} />
            </div>
            <ProgressBar project={p} />
            <p className="text-xs text-stone-500">
              いま終了した場合の受け取り額：<span className="font-bold text-ink">{formatYen(payoutAmount(p.raised))}</span>
              {p.fundingModel === "all_or_nothing" && progressPercent(p) < 100 && "（All-or-Nothingのため、目標達成が条件です）"}
            </p>

            <SupportChart data={dailySupport(p.raised, p.startAt)} title={`日ごとの支援額（公開から${CHART_DAYS}日間）`} />

            <div>
              <h3 className="mb-2 text-sm font-bold text-stone-500">リターン別の支援状況</h3>
              <ul className="space-y-3">
                {p.rewards.map((r) => {
                  const ratio = r.limit ? r.backers / r.limit : null;
                  return (
                    <li key={r.id} className="text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span>{r.title}</span>
                        <span className="text-stone-500">
                          {formatYen(r.price)}・{formatNumber(r.backers)}
                          {r.limit !== undefined && ` / ${r.limit}`}人
                        </span>
                      </div>
                      {ratio !== null && (
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                          <div className={`h-full rounded-full ${ratio >= 0.9 ? "bg-pop-pink" : "bg-brand/70"}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      {artist?.membership && (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-stone-200 bg-white p-5">
          <div>
            <p className="text-sm font-bold">メンバーシップ</p>
            <p className="mt-1 text-sm text-stone-600">
              メンバー {formatNumber(totalMembers(artist.membership))}人・今月の売上 {formatYen(membershipMonthly)}
            </p>
          </div>
          <Link href="/creator/membership" className="border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">
            設定を見る
          </Link>
        </section>
      )}
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
