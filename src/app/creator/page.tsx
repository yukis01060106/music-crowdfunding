import Link from "next/link";
import { getCreatorProjects } from "@/lib/data";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";
import { PageTitle } from "@/components/side-nav";
import { ProgressBar } from "@/components/project/progress";
import { DaysLeft } from "@/components/project/days-left";
import { STATUS_LABELS } from "./project-status";

export default async function CreatorDashboardPage() {
  const projects = await getCreatorProjects();

  return (
    <>
      <div className="flex items-start justify-between">
        <PageTitle>ダッシュボード</PageTitle>
        <Link href="/creator/projects/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
          ＋ 新しいプロジェクト
        </Link>
      </div>

      {projects.map((p) => {
        const status = STATUS_LABELS[p.status];
        return (
          <section key={p.slug} className="space-y-4 border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
              <Link href={`/projects/${p.slug}`} className="font-bold hover:text-brand">
                {p.title}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label="支援総額" value={formatYen(p.raised)} />
              <Kpi label="達成率" value={`${progressPercent(p)}%`} />
              <Kpi label="支援者" value={`${formatNumber(p.backers)}人`} />
              <Kpi label="残り" value={<DaysLeft endAt={p.endAt} />} />
            </div>
            <ProgressBar project={p} />
            <h3 className="pt-2 text-sm font-bold text-stone-500">リターン別の支援状況</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-stone-100">
                {p.rewards.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2">{r.title}</td>
                    <td className="py-2 text-right text-stone-500">{formatYen(r.price)}</td>
                    <td className="py-2 text-right">
                      {r.backers}
                      {r.limit !== undefined && ` / ${r.limit}`}人
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
