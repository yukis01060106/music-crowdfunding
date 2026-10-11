import type { Metadata } from "next";
import Link from "next/link";
import { LiveAmount, LiveBackers, LivePercent, LiveProgressBar } from "@/components/project/live-figures";
import { notFound } from "next/navigation";
import { getArtist, getProject, getPublicProjects } from "@/lib/data";
import { FUNDING_MODEL_LABELS, GENRE_LABELS } from "@/types";
import { formatDate, formatGoal } from "@/lib/format";
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
import { baseOpenGraph, OG_SIZE, SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { SupportCta, SuspendedNotice } from "@/components/project/support-cta";
import { TrustLines } from "@/components/project/trust-lines";
import { buttonClass } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import { ReportButton } from "@/components/project/report-button";
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
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      title: project.title,
      description: project.catchcopy,
      url: `/projects/${project.slug}/`,
      images: [{ url: `/og/projects/${project.slug}/image.png`, width: OG_SIZE.width, height: OG_SIZE.height, alt: project.title }],
    },
  };
}

export default async function ProjectLayout({ params, children }: LayoutProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const artist = await getArtist(project.artistId);
  const popularId = mostPopularRewardId(project.rewards);
  const recentBackers = [...project.comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  const prices = project.rewards.map((r) => r.price);
  const soldOut = project.rewards.every((r) => r.limit !== undefined && r.backers >= r.limit);
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "プロジェクト", item: `${SITE_URL}/projects/` },
        { "@type": "ListItem", position: 2, name: GENRE_LABELS[project.genre], item: `${SITE_URL}/genres/${project.genre}/` },
        { "@type": "ListItem", position: 3, name: project.title, item: `${SITE_URL}/projects/${project.slug}/` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: project.title,
      description: project.catchcopy,
      image: `${SITE_URL}${project.cover}`,
      brand: artist ? { "@type": "Brand", name: artist.name } : undefined,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "JPY",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: project.rewards.length,
        availability: project.status === "live" && !soldOut ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        url: `${SITE_URL}/projects/${project.slug}/`,
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-8">
      <JsonLd data={structured} />
      <nav aria-label="パンくずリスト" className="text-xs text-stone-500">
        <Link href="/projects" className="hover:text-brand">
          プロジェクト
        </Link>
        {" › "}
        <Link href={`/genres/${project.genre}`} className="hover:text-brand">
          {GENRE_LABELS[project.genre]}
        </Link>
        <span className="hidden sm:inline">
          {" › "}
          <span aria-current="page" className="text-stone-600">
            {project.title.length > 30 ? `${project.title.slice(0, 30)}…` : project.title}
          </span>
        </span>
      </nav>

      <SuspendedNotice slug={project.slug} />
      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadges project={project} />
        </div>
        <h1 className="mt-2 text-2xl font-black leading-snug tracking-[0.08em] sm:text-3xl">{project.title}</h1>
        <p className="mt-2 text-stone-600">{project.catchcopy}</p>
        {/* スマホでは最初の画面に、支援の進み具合を1行で出す */}
        <div className="mt-4 lg:hidden">
          <p className="flex items-baseline justify-between gap-2 text-sm">
            <span>
              <span className="font-en text-xl font-black">
                <LiveAmount project={project} />
              </span>
              <span className="ml-1 text-xs text-stone-500">/ 目標 {formatGoal(project)}</span>
            </span>
            <LivePercent project={project} className="font-en text-lg font-black" />
          </p>
          <div className="mt-1.5">
            <LiveProgressBar project={project} size="md" />
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            <LiveBackers project={project} />
            人が支援・残り <DaysLeft endAt={project.endAt} />
          </p>
        </div>
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
            {/* サムネイルや送りボタンにかからないよう、写真の左上の角に置く */}
            <Sticker shape="triangle" color="purple" size={40} className="-left-3 -top-3" />
          </div>

          <TrackList tracks={project.tracks} />

          {/* スマホでは右カラムが本文の後ろに回るので、リターンへの入口と安心の材料を先に見せる */}
          <div className="space-y-3 border-[3px] border-ink/10 bg-white p-4 lg:hidden">
            <a href="#rewards" className={buttonClass("secondary", "md", "w-full")}>
              リターンを見る（{project.rewards.length}種類）
            </a>
            <FavoriteButton slug={project.slug} />
            <TrustLines project={project} />
          </div>

          <ProjectTabs slug={project.slug} updateCount={project.updates.length} commentCount={project.comments.length} />
          {children}
        </div>

        <aside className="space-y-4">
          {/* スマホでは上の要約の箱と同じ内容になるので、PC だけで出す */}
          <div className="hidden space-y-4 border-[3px] border-ink bg-white p-5 shadow-sticker lg:block">
            <div>
              <p className="text-xs text-stone-500">
                {project.goalType === "participants" ? "参加人数" : "現在の支援総額"}
              </p>
              <p className="font-en text-3xl font-black tracking-tight">
                <LiveAmount project={project} />
              </p>
              <p className="text-xs text-stone-500">目標 {formatGoal(project)}</p>
            </div>
            <LiveProgressBar project={project} size="lg" />
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label="達成率" value={<LivePercent project={project} />} />
              <Stat label="支援者" value={<><LiveBackers project={project} />人</>} />
              <Stat label="残り" value={<DaysLeft endAt={project.endAt} />} />
            </dl>
            <p className="bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
              {FUNDING_MODEL_LABELS[project.fundingModel]}
              <br />
              {formatDate(project.endAt)}まで募集
            </p>
            <SupportCta project={project} className={buttonClass("primary", "lg", "w-full")}>
              リターンを選んで支援する
            </SupportCta>
            <TrustLines project={project} />
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
                      <span className="shrink-0 text-stone-500">{formatDate(c.createdAt)}</span>
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
              実行者に質問する（ログインが必要）
            </Link>
            <div className="text-center"><ReportButton slug={project.slug} title={project.title} /></div>
          </div>

          {/* スマホでは、リターンの直前に最近の支援を出す（ほかの人も支援している安心） */}
          {recentBackers.length > 0 && (
            <div className="bg-stone-50 p-4 lg:hidden">
              <p className="mb-2 text-xs font-bold text-stone-600">最近の支援</p>
              <ul className="space-y-1.5 text-xs">
                {recentBackers.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      <span className="font-medium">{c.userName}</span>さんが支援しました
                    </span>
                    <span className="shrink-0 text-stone-500">{formatDate(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h2 id="rewards" className="flex scroll-mt-20 flex-wrap items-baseline gap-x-2 pt-2 font-bold">
            リターンを選ぶ
            <span className="text-xs font-normal text-stone-500">
              <LiveBackers project={project} />
              人が支援中・表示価格は税込・送料込み
            </span>
          </h2>
          <div className="space-y-4">
            {project.rewards.map((r) => (
              <RewardCard key={r.id} reward={r} project={project} popular={r.id === popularId} />
            ))}
          </div>
          <div className="space-y-3 border-t border-stone-200 pt-4 lg:hidden">
            <ShareButtons title={project.title} />
            <div className="flex items-center justify-between gap-2">
              <Link href={`/mypage/messages?to=${project.slug}`} className="inline-flex min-h-11 items-center text-sm text-stone-600 underline hover:text-brand">
                実行者に質問する（ログインが必要）
              </Link>
              <ReportButton slug={project.slug} title={project.title} />
            </div>
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
