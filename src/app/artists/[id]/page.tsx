import type { Metadata } from "next";
import Link from "next/link";
import { tagClass } from "@/components/ui/tag";
import { notFound } from "next/navigation";
import { getArtist, getArtists, getProjectsByArtist } from "@/lib/data";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { ProjectGrid } from "@/components/project/project-grid";
import { VerifiedBadge } from "@/components/project/verified-badge";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";
import { SectionHeading } from "@/components/ui/section-heading";
import { CommonPerks } from "@/components/membership/common-perks";
import { SellerInfo } from "@/components/project/seller-info";
import { baseOpenGraph, OG_SIZE, SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { PlanCard, mostPopularPlanId } from "@/components/membership/plan-card";
import { chipClass } from "@/components/ui/chip";

export const revalidate = 300;

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[id]">): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return {};
  return {
    title: artist.name,
    description: artist.bio,
    alternates: { canonical: `/artists/${artist.id}/` },
    openGraph: {
      ...baseOpenGraph,
      type: "profile",
      title: artist.name,
      description: artist.bio,
      url: `/artists/${artist.id}/`,
      images: [{ url: `/og/artists/${artist.id}/image.png`, width: OG_SIZE.width, height: OG_SIZE.height, alt: artist.name }],
    },
  };
}

export default async function ArtistPage({ params }: PageProps<"/artists/[id]">) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();
  const projects = await getProjectsByArtist(artist.id);
  const popularPlanId = artist.membership && mostPopularPlanId(artist.membership.plans);

  // アカウントまで含む URL だけを関連づける（サービスのトップページだけの仮リンクは除く）
  const sameAs = artist.links.map((l) => l.url).filter((u) => new URL(u).pathname.length > 1);
  const structured = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    description: artist.bio,
    image: `${SITE_URL}${artist.photo}`,
    url: `${SITE_URL}/artists/${artist.id}/`,
    genre: artist.genres.map((g) => GENRE_LABELS[g]),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  return (
    <div>
      <JsonLd data={structured} />
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative h-[420px] overflow-hidden sm:h-[520px]">
          <Photo src={artist.photo} alt={artist.name} sizes="(min-width: 1152px) 1152px, 100vw" priority className="animate-[kenburns_14s_ease-out_forwards] object-[center_20%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent" aria-hidden />
          {/* 右下の名前が明るい写真でも読めるよう、下からも暗くする */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent" aria-hidden />
          <p
            className="absolute left-6 top-8 max-h-[80%] animate-rise text-lg font-bold [animation-delay:300ms] leading-[2] tracking-[0.2em] text-white sm:left-12 sm:text-2xl"
            style={{ writingMode: "vertical-rl" }}
          >
            {artist.catchline}
          </p>
          <div className="absolute bottom-8 right-6 animate-rise text-right text-white [animation-delay:500ms] sm:right-10">
            <p className="font-en text-xs font-bold tracking-wide text-white">Artist</p>
            <h1 className="mt-1 text-3xl font-black tracking-[0.12em] sm:text-5xl">{artist.name}</h1>
          </div>
          {/* 顔にかからないよう、スマホでは図形を出さない */}
          <Sticker shape="circle" color="yellow" size={64} className="right-8 top-8 hidden sm:block" float />
          <Sticker shape="triangle" color="purple" size={40} className="right-28 top-24 hidden sm:block" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <VerifiedBadge verified={artist.verified} />
          {artist.types.map((t) => (
            <Link key={t} href={`/types/${t}`} className={tagClass("neutral", "min-h-8 px-2.5 hover:bg-brand hover:text-white")}>
              {ARTIST_TYPE_LABELS[t]}
            </Link>
          ))}
          <span className="text-stone-500">{artist.genres.map((g) => GENRE_LABELS[g]).join(" / ")}</span>
        </div>
        <p className="mt-6 max-w-2xl leading-loose tracking-wider text-stone-700">{artist.bio}</p>
        {artist.membership && (
          <nav aria-label="このページの内容" className="mt-6 flex flex-wrap gap-2 text-sm">
            <a href="#projects" className={chipClass()}>
              プロジェクト
            </a>
            <a href="#membership" className={chipClass()}>
              メンバーシップ
            </a>
          </nav>
        )}
        <ul className="mt-4 flex gap-4 text-sm">
          {artist.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-en font-bold text-brand hover:underline">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <section id="projects" className="mt-16 scroll-mt-20">
          <div className="mb-10">
            <SectionHeading en="Projects" ja="プロジェクト" lead={projects.length > 0 ? "プロジェクトを支援して、制作を応援しましょう。" : undefined} />
          </div>
          <ProjectGrid projects={projects} artists={[artist]} />
        </section>
        {artist.membership && (
          <section id="membership" className="mt-20 scroll-mt-20 space-y-8">
            <SectionHeading en="Membership" ja="月額メンバーになって応援する" lead="いつでも解約できます。解約しても、次の更新日の前日まで特典を使えます。" />
            <blockquote data-reveal="left" className="border-l-4 border-brand pl-4 font-bold leading-relaxed tracking-wider">
              「{artist.membership.message}」
              <span className="mt-1 block text-xs font-normal text-stone-500">— {artist.name}</span>
            </blockquote>
            <div data-stagger className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {artist.membership.plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} artistId={artist.id} popular={plan.id === popularPlanId} />
              ))}
            </div>
            <div>
              <p className="mb-4 text-sm font-bold tracking-wider">どのプランにも付く、OTOFUNDメンバー共通の特典</p>
              <CommonPerks />
            </div>
            <SellerInfo artist={artist} kind="membership" />
          </section>
        )}
      </div>
    </div>
  );
}
