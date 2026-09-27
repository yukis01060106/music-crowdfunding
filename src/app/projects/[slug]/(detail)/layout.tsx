import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtist, getProject, getPublicProjects } from "@/lib/data";
import { FUNDING_MODEL_LABELS, GENRE_LABELS } from "@/types";
import { formatDate, formatGoal, formatNumber, formatYen, progressPercent } from "@/lib/format";
import { ProgressBar } from "@/components/project/progress";
import { DaysLeft } from "@/components/project/days-left";
import { ProjectTabs } from "@/components/project/project-tabs";
import { RewardCard } from "@/components/project/reward-card";
import { FavoriteButton } from "@/components/project/favorite-button";

// 公開中のプロジェクトはビルド時に静的生成し、支援額などは60秒ごとに再生成する（ISR）。
// ビルド後に公開されたプロジェクトは、初回アクセス時に生成される。
export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: LayoutProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return { title: project.title, description: project.catchcopy };
}

export default async function ProjectLayout({ params, children }: LayoutProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const artist = await getArtist(project.artistId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm text-stone-500">
          <Link href={`/genres/${project.genre}`} className="hover:text-brand">
            {GENRE_LABELS[project.genre]}
          </Link>
          {artist && (
            <>
              {" ・ "}
              <Link href={`/artists/${artist.id}`} className="hover:text-brand">
                {artist.name}
              </Link>
            </>
          )}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">{project.title}</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className={`aspect-video rounded-2xl bg-gradient-to-br ${project.color}`} />
          <ProjectTabs slug={project.slug} updateCount={project.updates.length} commentCount={project.comments.length} />
          {children}
        </div>

        <aside className="space-y-4">
          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
            <div>
              <p className="text-xs text-stone-500">
                {project.goalType === "participants" ? "参加人数" : "現在の支援総額"}
              </p>
              <p className="text-3xl font-bold">
                {project.goalType === "participants"
                  ? `${formatNumber(project.backers)}人`
                  : formatYen(project.raised)}
              </p>
              <p className="text-xs text-stone-500">目標 {formatGoal(project)}</p>
            </div>
            <ProgressBar project={project} />
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label="達成率" value={`${progressPercent(project)}%`} />
              <Stat label="支援者" value={`${formatNumber(project.backers)}人`} />
              <Stat label="残り" value={<DaysLeft endAt={project.endAt} />} />
            </dl>
            <p className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
              {FUNDING_MODEL_LABELS[project.fundingModel]}
              <br />
              {formatDate(project.endAt)}まで募集
            </p>
            <Link
              href={`/projects/${project.slug}/support`}
              className="block rounded-lg bg-brand py-3 text-center font-bold text-white hover:bg-brand-dark"
            >
              このプロジェクトを支援する
            </Link>
            <FavoriteButton />
            <Link
              href={`/mypage/messages?to=${project.slug}`}
              className="block text-center text-sm text-stone-500 hover:text-brand"
            >
              実行者に問い合わせる
            </Link>
          </div>

          <h2 className="pt-2 font-bold">リターンを選ぶ</h2>
          {project.rewards.map((r) => (
            <RewardCard key={r.id} reward={r} projectSlug={project.slug} />
          ))}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
