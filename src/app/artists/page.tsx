import type { Metadata } from "next";
import { getArtists, getPublicProjects } from "@/lib/data";
import { ArtistDirectory } from "./artist-directory";

export const metadata: Metadata = { title: "アーティスト", description: "OTOFUNDで挑戦中のアーティスト一覧。高校生バンドから歌い手、インディーズまで。", alternates: { canonical: "/artists/" } };
export const revalidate = 300;

export default async function ArtistsPage() {
  const [artists, projects] = await Promise.all([getArtists(), getPublicProjects()]);
  const projectCounts: Record<string, number> = {};
  for (const p of projects) projectCounts[p.artistId] = (projectCounts[p.artistId] ?? 0) + 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-en text-xs font-medium tracking-wide text-stone-500">Artists</p>
      <h1 className="mt-1 text-2xl font-black tracking-[0.12em] sm:text-3xl">アーティスト</h1>
      <p className="mt-3 text-sm text-stone-600">高校生バンドから歌い手、インディーズ、メジャーまで。気になるアーティストを見つけて、プロジェクトやメンバーシップで応援しましょう。</p>
      <ArtistDirectory artists={artists} projectCounts={projectCounts} />
    </div>
  );
}
