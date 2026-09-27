import Link from "next/link";
import { getPublicProjects } from "@/lib/data";
import { formatDate, formatYen } from "@/lib/format";
import { PageTitle } from "@/components/side-nav";

// モック: ログイン中のユーザーが支援した内容
const backings = [
  { projectSlug: "hoshizora-1st-album", rewardId: "r-cd", backedAt: "2026-09-03T12:10:00+09:00", status: "決済予定（目標達成後）" },
  { projectSlug: "neon-kaiju-1000", rewardId: "r-ticket", backedAt: "2026-09-18T09:30:00+09:00", status: "決済済み" },
];

export default async function BackedProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <>
      <PageTitle>支援したプロジェクト</PageTitle>
      <ul className="space-y-3">
        {backings.map((b) => {
          const project = projects.find((p) => p.slug === b.projectSlug);
          const reward = project?.rewards.find((r) => r.id === b.rewardId);
          if (!project || !reward) return null;
          return (
            <li key={b.projectSlug} className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4">
              <div className={`h-16 w-24 shrink-0 rounded-lg bg-gradient-to-br ${project.color}`} />
              <div className="min-w-0 flex-1">
                <Link href={`/projects/${project.slug}`} className="line-clamp-1 font-bold hover:text-brand">
                  {project.title}
                </Link>
                <p className="text-sm text-stone-600">
                  {reward.title}・{formatYen(reward.price)}
                </p>
                <p className="text-xs text-stone-500">
                  {formatDate(b.backedAt)}に支援・{b.status}・お届け予定 {reward.deliveryEstimate}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
