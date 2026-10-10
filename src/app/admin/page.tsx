import Link from "next/link";
import { getArtists, getPublicProjects } from "@/lib/data";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";
import { PLATFORM_FEE_RATE } from "@/lib/fees";
import { PageTitle } from "@/components/side-nav";
import { Kpi, SectionTitle } from "./admin-ui";
import { InboxPreview, LiveKpis, RecentActivity, TodoList } from "./todo-list";
import { FINISHED_PAYOUTS, INBOX, PAYMENT_FAILURES, REFUND_REQUESTS, REVIEW_QUEUE } from "./admin-data";

export default async function AdminPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  // 掲載停止はこのブラウザに保存しているので、数字はクライアントの部品で差し引く
  const liveRows = projects
    .filter((p) => p.status === "live")
    .map((p) => ({ slug: p.slug, raised: p.raised, earnsFee: p.fundingModel === "all_in" || progressPercent(p) >= 100 }));
  const members = artists.reduce((sum, a) => sum + (a.membership?.plans.reduce((s, p) => s + p.members, 0) ?? 0), 0);
  const membershipMonthly = artists.reduce((sum, a) => sum + (a.membership?.plans.reduce((s, p) => s + p.price * p.members, 0) ?? 0), 0);

  return (
    <>
      <PageTitle>ダッシュボード</PageTitle>
      <div data-stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <LiveKpis rows={liveRows} feeRate={PLATFORM_FEE_RATE} />
        <Kpi label="メンバーシップ" value={`${formatNumber(members)}人`} note={`${formatYen(membershipMonthly)} / 月`} />
      </div>

      <SectionTitle>対応が必要なもの</SectionTitle>
      {/* 件数が多い順ではなく、お金と信頼に関わるものを上に置く */}
      <TodoList refunds={REFUND_REQUESTS} failures={PAYMENT_FAILURES} payouts={FINISHED_PAYOUTS} inbox={INBOX} reviewIds={REVIEW_QUEUE.map((q) => q.id)} />

      <SectionTitle
        aside={
          <Link href="/admin/inbox" className="inline-flex min-h-11 items-center text-sm text-brand underline">
            すべて見る
          </Link>
        }
      >
        新しい問い合わせ・通報
      </SectionTitle>
      <InboxPreview inbox={INBOX} />

      <SectionTitle
        aside={
          <Link href="/admin/logs" className="inline-flex min-h-11 items-center text-sm text-brand underline">
            操作の記録をすべて見る
          </Link>
        }
      >
        最近の操作
      </SectionTitle>
      <RecentActivity />

      <p className="mt-8 text-xs text-stone-500">手数料収入の一部は、ONE NOTE FES の開催費用にあてます。あてる割合は事業計画で決めます。</p>
    </>
  );
}
