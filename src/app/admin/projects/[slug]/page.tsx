import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtist, getProject, getPublicProjects } from "@/lib/data";
import { formatDate, formatNumber, formatPrice, formatYen, progressPercent } from "@/lib/format";
import { feeAmount, payoutAmount, PAYOUT_DAYS } from "@/lib/fees";
import { FUNDING_MODEL_LABELS } from "@/types";
import { tagClass } from "@/components/ui/tag";
import { buttonClass } from "@/components/ui/button";
import { DemoNote, Kpi, SectionTitle, TableBox, TD, TH } from "../../admin-ui";
import { INBOX, REFUND_REQUESTS } from "../../admin-data";
import { SuspendControl } from "../suspend-control";
import { QuietNotice } from "./quiet-notice";
import { ProjectStatusTag, RelatedList } from "./detail-parts";

export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/admin/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return { title: project ? `${project.title}（運営）` : "プロジェクト" };
}

export default async function AdminProjectDetailPage({ params }: PageProps<"/admin/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const artist = await getArtist(project.artistId);
  const percent = progressPercent(project);
  const willPay = project.fundingModel === "all_in" || percent >= 100;
  const lastUpdate = project.updates.map((u) => u.publishedAt).sort().at(-1);
  const related = INBOX.filter((i) => i.targetSlug === project.slug || i.target === project.title);
  const refunds = REFUND_REQUESTS.filter((r) => r.project === project.title);
  const rewardTotal = project.rewards.reduce((s, r) => s + r.price * r.backers, 0);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/projects" className="text-brand underline">
          ← プロジェクトの一覧
        </Link>
      </p>
      <h1 className="text-2xl font-black leading-snug tracking-[0.08em]">{project.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
        <ProjectStatusTag slug={project.slug} status={project.status} />
        <span>{artist?.name}</span>
        <span className="border-l border-stone-300 pl-3">{FUNDING_MODEL_LABELS[project.fundingModel]}</span>
        <span className="border-l border-stone-300 pl-3">
          {formatDate(project.startAt)}〜{formatDate(project.endAt)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href={`/projects/${project.slug}`} className={buttonClass("secondary", "md")}>
          公開ページを見る
        </Link>
        <SuspendControl slug={project.slug} title={project.title} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={project.goalType === "participants" ? "参加人数" : "集まった額"} value={project.goalType === "participants" ? `${formatNumber(project.backers)}人` : formatYen(project.raised)} note={project.goalType === "participants" ? `支援額 ${formatYen(project.raised)}` : undefined} />
        <Kpi label="達成率" value={`${percent}%`} note={`目標 ${project.goalType === "participants" ? `${formatNumber(project.goal)}人` : formatYen(project.goal)}`} />
        {project.goalType === "participants" ? (
          <Kpi label="1人あたりの支援額" value={formatYen(project.backers > 0 ? Math.round(project.raised / project.backers) : 0)} note="0円の参加を含む平均" />
        ) : (
          <Kpi label="支援者" value={`${formatNumber(project.backers)}人`} />
        )}
        <Kpi
          label="振込の見込み"
          value={willPay ? formatYen(payoutAmount(project.raised)) : "—"}
          note={willPay ? `手数料 ${formatYen(feeAmount(project.raised))}・終了の約${PAYOUT_DAYS}日後` : "目標に届かなければ振込なし"}
        />
      </div>

      <QuietNotice lastUpdate={lastUpdate} startAt={project.startAt} />

      <SectionTitle aside={`リターンの売上の合計 ${formatYen(rewardTotal)}（上乗せ支援を除く）`}>リターンごとの支援</SectionTitle>
      <TableBox label="リターンごとの支援" minWidth={600}>
        <thead className="bg-stone-50">
          <tr>
            <th className={TH}>リターン</th>
            <th className={`${TH} text-right`}>金額</th>
            <th className={`${TH} text-right`}>支援数</th>
            <th className={`${TH} text-right`}>売上</th>
            <th className={TH}>お届け予定</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {project.rewards.map((r) => {
            const soldOut = r.limit !== undefined && r.backers >= r.limit;
            return (
              <tr key={r.id}>
                <th scope="row" className={`${TD} text-left font-bold`}>
                  {r.title}
                  {soldOut && <span className={tagClass("neutral", "ml-2")}>受付終了</span>}
                </th>
                <td className={`${TD} text-right`}>{formatPrice(r.price)}</td>
                <td className={`${TD} text-right`}>
                  {formatNumber(r.backers)}
                  {r.limit !== undefined && <span className="text-stone-500"> / {formatNumber(r.limit)}</span>}
                </td>
                <td className={`${TD} text-right`}>{r.price === 0 ? "—" : formatYen(r.price * r.backers)}</td>
                <td className={`${TD} text-stone-600`}>{r.price === 0 ? "—" : r.deliveryEstimate}</td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>

      <SectionTitle>このプロジェクトへの問い合わせ・通報・返金</SectionTitle>
      <RelatedList inbox={related} refunds={refunds} slug={project.slug} title={project.title} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle aside={`${project.updates.length}件`}>活動報告</SectionTitle>
          <ul className="space-y-2 text-sm">
            {[...project.updates].reverse().slice(0, 3).map((u) => (
              <li key={u.id} className="border border-stone-200 bg-white p-3">
                <p className="font-bold">
                  {u.title}
                  {u.backersOnly && <span className={tagClass("brand", "ml-2")}>支援者限定</span>}
                </p>
                <p className="text-xs text-stone-500">{formatDate(u.publishedAt)}</p>
              </li>
            ))}
            {project.updates.length === 0 && <li className="text-stone-500">まだありません。</li>}
          </ul>
        </section>
        <section>
          <SectionTitle aside={`${project.comments.length}件`}>最近の応援コメント</SectionTitle>
          <ul className="space-y-2 text-sm">
            {[...project.comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map((c) => (
              <li key={c.id} className="border border-stone-200 bg-white p-3">
                <p className="leading-relaxed">「{c.body}」</p>
                <p className="mt-1 text-xs text-stone-500">
                  {c.userName}さん・{c.amount === 0 ? "0円で参加" : formatYen(c.amount)}・{formatDate(c.createdAt)}
                </p>
              </li>
            ))}
            {project.comments.length === 0 && <li className="text-stone-500">まだありません。</li>}
          </ul>
        </section>
      </div>

      <DemoNote>デモのため、数字は見本のデータから出しています。本番では、支援・返金・問い合わせのデータをこのプロジェクトで絞り込んで表示します。</DemoNote>
    </>
  );
}
