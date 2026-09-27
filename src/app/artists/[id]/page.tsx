import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtist, getArtists, getProjectsByArtist } from "@/lib/data";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { ProjectGrid } from "@/components/project/project-grid";

export const revalidate = 300;

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[id]">): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  return { title: artist?.name };
}

export default async function ArtistPage({ params }: PageProps<"/artists/[id]">) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();
  const projects = await getProjectsByArtist(artist.id);

  return (
    <div>
      <div className={`h-40 bg-gradient-to-br ${artist.color}`} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {artist.types.map((t) => (
            <Link key={t} href={`/types/${t}`} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-brand">
              {ARTIST_TYPE_LABELS[t]}
            </Link>
          ))}
          <span className="text-stone-500">{artist.genres.map((g) => GENRE_LABELS[g]).join(" / ")}</span>
        </div>
        <h1 className="mt-1 text-3xl font-bold">{artist.name}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone-700">{artist.bio}</p>
        <ul className="mt-4 flex gap-4 text-sm">
          {artist.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <h2 className="mb-4 mt-10 text-xl font-bold">プロジェクト</h2>
        <ProjectGrid projects={projects} artists={[artist]} />
      </div>
    </div>
  );
}
