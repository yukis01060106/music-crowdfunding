import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtists, getProjectsByArtistType } from "@/lib/data";
import { ARTIST_TYPE_LABELS, type ArtistType } from "@/types";
import { BrowseNav } from "@/components/project/browse-nav";
import { ProjectGrid } from "@/components/project/project-grid";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ARTIST_TYPE_LABELS).map((type) => ({ type }));
}

function isArtistType(value: string): value is ArtistType {
  return value in ARTIST_TYPE_LABELS;
}

export async function generateMetadata({ params }: PageProps<"/types/[type]">): Promise<Metadata> {
  const { type } = await params;
  return { title: isArtistType(type) ? `${ARTIST_TYPE_LABELS[type]}のプロジェクト` : undefined };
}

export default async function ArtistTypePage({ params }: PageProps<"/types/[type]">) {
  const { type } = await params;
  if (!isArtistType(type)) notFound();
  const [projects, artists] = await Promise.all([getProjectsByArtistType(type), getArtists()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{ARTIST_TYPE_LABELS[type]}のプロジェクト</h1>
      <BrowseNav current={{ kind: "type", value: type }} />
      <ProjectGrid projects={projects} artists={artists} />
    </div>
  );
}
