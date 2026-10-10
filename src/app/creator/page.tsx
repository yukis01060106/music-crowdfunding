import Link from "next/link";
import { getArtist, getCreatorProjects } from "@/lib/data";
import { buttonClass } from "@/components/ui/button";
import { TAG_BASE } from "@/components/ui/tag";
import { formatDate, formatNumber, formatYen } from "@/lib/format";
import { totalMembers } from "@/lib/membership";
import { PageTitle } from "@/components/side-nav";
import { DaysLeft } from "@/components/project/days-left";
import { STATUS_LABELS } from "./project-status";
import { CreatorProjectKpis, CreatorRemaining, CreatorSupportChart, CreatorStatusTag, CreatorTodos, SubmissionList } from "./dashboard-live";

import { CREATOR_ARTIST_ID as CURRENT_ARTIST_ID, CREATOR_PROJECT_SLUG } from "./creator-context";
export default async function CreatorDashboardPage() {
  const [projects, artist] = await Promise.all([getCreatorProjects(), getArtist(CURRENT_ARTIST_ID)]);
  const membershipMonthly = artist?.membership?.plans.reduce((sum, p) => sum + p.price * p.members, 0) ?? 0;

  // TODO（本番）: 未返信・未発送・活動報告の日付は、それぞれのテーブルから数える
  const main = projects.find((p) => p.slug === CREATOR_PROJECT_SLUG) ?? projects[0];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle>ダッシュボード</PageTitle>
        <Link href="/creator/projects/new" className={buttonClass("primary", "md")}>
          ＋ 新しいプロジェクト
        </Link>
      </div>

      <section className="mb-8 mt-4">
        <h2 className="mb-3 text-sm font-bold text-stone-500">やること</h2>
        <CreatorTodos lastSampleUpdate={main?.updates.at(-1)?.publishedAt} shippingRewardIds={(main?.rewards ?? []).filter((r) => r.requiresShipping).map((r) => r.id)} />
      </section>

      <SubmissionList />

      {projects.map((p) => {
        const status = STATUS_LABELS[p.status];
        return (
          <section key={p.slug} className="space-y-5 border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <CreatorStatusTag slug={p.slug} label={status.label} className={`${TAG_BASE} ${status.className}`} />
              <Link href={`/projects/${p.slug}`} className="font-bold hover:text-brand">
                {p.title}
              </Link>
              <span className="text-xs text-stone-500">{formatDate(p.endAt)}まで</span>
            </div>
            <p className="text-sm text-stone-600">
              <CreatorRemaining slug={p.slug}>
                残り <DaysLeft endAt={p.endAt} />
              </CreatorRemaining>
            </p>
            <CreatorProjectKpis project={p} />

            <CreatorSupportChart project={p} />

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
          <Link href="/creator/membership" className={buttonClass("secondary", "md")}>
            設定を見る
          </Link>
        </section>
      )}
    </>
  );
}

