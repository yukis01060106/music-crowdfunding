import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtists, getProjectsByGenre } from "@/lib/data";
import { GENRE_LABELS, type Genre } from "@/types";
import { BrowseNav } from "@/components/project/browse-nav";
import { ProjectGrid } from "@/components/project/project-grid";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(GENRE_LABELS).map((genre) => ({ genre }));
}

function isGenre(value: string): value is Genre {
  return value in GENRE_LABELS;
}

export async function generateMetadata({ params }: PageProps<"/genres/[genre]">): Promise<Metadata> {
  const { genre } = await params;
  return { title: isGenre(genre) ? `${GENRE_LABELS[genre]}のプロジェクト` : undefined };
}

export default async function GenrePage({ params }: PageProps<"/genres/[genre]">) {
  const { genre } = await params;
  if (!isGenre(genre)) notFound();
  const [projects, artists] = await Promise.all([getProjectsByGenre(genre), getArtists()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-en text-xs font-medium tracking-wide text-stone-500">Projects</p>
      <h1 className="mt-1 text-3xl font-black tracking-[0.12em]">{GENRE_LABELS[genre]}のプロジェクト</h1>
      <BrowseNav current={{ kind: "genre", value: genre }} />
      <ProjectGrid projects={projects} artists={artists} />
    </div>
  );
}
