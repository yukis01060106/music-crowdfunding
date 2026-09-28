import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtist, getProject, getPublicProjects } from "@/lib/data";
import { FUNDING_MODEL_LABELS, GENRE_LABELS } from "@/types";
import { formatDate, formatGoal, formatNumber, formatYen, progressPercent } from "@/lib/format";
import { ProgressBar } from "@/components/project/progress";
import { DaysLeft } from "@/components/project/days-left";
import { ProjectTabs } from "@/components/project/project-tabs";
import { RewardCard, mostPopularRewardId } from "@/components/project/reward-card";
import { FavoriteButton } from "@/components/project/favorite-button";
import { ShareButtons } from "@/components/project/share-buttons";
import { MobileSupportBar } from "@/components/project/mobile-support-bar";
import { StatusBadges } from "@/components/project/status-badges";
import { VerifiedBadge } from "@/components/project/verified-badge";
import { TrackList } from "@/components/project/track-list";
import { ProjectMedia } from "@/components/project/project-media";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";

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
  return {
    title: project.title,
    description: project.catchcopy,
    openGraph: { title: project.title, description: project.catchcopy, type: "article", images: [{ url: project.cover, alt: project.title }] },
  };
}

export default async function ProjectLayout({ params, children }: LayoutProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const artist = await getArtist(project.artistId);
  const popularId = mostPopularRewardId(project.rewards);
  const recentBackers = [...project.comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-8">
      <nav aria-label="パンくずリスト" className="text-xs text-stone-500">
        <Link href="/projects" className="hover:text-brand">
          プロジェクト
        </Link>
        {" › "}
        <Link href={`/genres/${project.genre}`} className="hover:text-brand">
          {GENRE_LABELS[project.genre]}
        </Link>
      </nav>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadges project={project} />
        </div>
        <h1 className="mt-2 text-2xl font-black leading-snug tracking-[0.08em] sm:text-3xl">{project.title}</h1>
        <p className="mt-2 text-stone-600">{project.catchcopy}</p>
        {artist && (
          <Link href={`/artists/${artist.id}`} className="mt-4 inline-flex items-center gap-3 group">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
              <Photo src={artist.photo} alt="" sizes="44px" />
            </span>
            <span>
              <span className="flex items-center gap-2 font-bold group-hover:text-brand">
                {artist.name}
                <VerifiedBadge verified={artist.verified} />
              </span>
              <span className="text-xs text-stone-500">アーティストのページを見る</span>
            </span>
          </Link>
        )}
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <div className="relative">
            <ProjectMedia title={project.title} images={[project.cover, ...(project.gallery ?? [])]} videoUrl={project.videoUrl} color={project.color} />
            <Sticker shape="circle" color="yellow" size={56} className="-right-3 -top-4" float />
            <Sticker shape="triangle" color="purple" size={40} className="-bottom-4 left-6" />
          </div>

          {/* スマホでは右カラムが本文の後ろに回るので、支援状況を先に見せる */}
          <div className="space-y-3 border border-stone-200 bg-white p-4 lg:hidden">
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-bold tracking-tight">
                {project.goalType === "participants"
                  ? `${formatNumber(project.backers)}人`
                  : formatYen(project.raised)}
              </p>
              <p className="text-lg font-bold text-brand">{progressPercent(project)}%</p>
            </div>
            <ProgressBar project={project} />
            <p className="text-xs text-stone-500">
              目標 {formatGoal(project)}・{formatNumber(project.backers)}人が支援・残り <DaysLeft endAt={project.endAt} />
            </p>
            <a href="#rewards" className="block rounded-lg border border-brand py-2 text-center text-sm font-bold text-brand">
              リターンを見る（{project.rewards.length}種類）
            </a>
          </div>

          <TrackList tracks={project.tracks} />
          <ProjectTabs slug={project.slug} updateCount={project.updates.length} commentCount={project.comments.length} />
          {children}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4 border border-stone-200 bg-white p-5">
            <div>
              <p className="text-xs text-stone-500">
                {project.goalType === "participants" ? "参加人数" : "現在の支援総額"}
              </p>
              <p className="text-3xl font-bold tracking-tight">
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
              className="block rounded-full bg-brand py-3.5 text-center font-bold text-white hover:bg-brand-dark"
            >
              このプロジェクトを支援する
            </Link>
            <FavoriteButton slug={project.slug} />
            {recentBackers.length > 0 && (
              <div className="border-t border-stone-100 pt-4">
                <p className="mb-2 text-xs text-stone-500">最近の支援</p>
                <ul className="space-y-1.5 text-xs">
                  {recentBackers.map((c) => (
                    <li key={c.id} className="flex justify-between gap-2">
                      <span className="truncate">
                        <span className="font-medium">{c.userName}</span>さんが支援しました
                      </span>
                      <span className="shrink-0 text-stone-400">{formatDate(c.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-stone-100 pt-4">
              <ShareButtons title={project.title} />
            </div>
            <Link
              href={`/mypage/messages?to=${project.slug}`}
              className="block text-center text-xs text-stone-500 hover:text-brand"
            >
              実行者に質問する
            </Link>
          </div>

          <h2 id="rewards" className="scroll-mt-20 pt-2 font-bold">
            リターンを選ぶ
            <span className="ml-2 text-xs font-normal text-stone-500">表示価格は税込・送料込み</span>
          </h2>
          <div className="space-y-4">
            {project.rewards.map((r) => (
              <RewardCard key={r.id} reward={r} projectSlug={project.slug} popular={r.id === popularId} />
            ))}
          </div>
        </aside>
      </div>

      <MobileSupportBar project={project} />
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
