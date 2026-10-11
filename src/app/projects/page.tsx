import { Eyebrow } from "@/components/ui/section-heading";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getArtists, getPublicProjects } from "@/lib/data";
import { BrowseNav } from "@/components/project/browse-nav";
import { ProjectExplorer } from "@/components/project/project-explorer";

export const metadata: Metadata = { title: "プロジェクトをさがす", description: "募集中の音楽プロジェクト一覧。インディーズバンドや歌い手のアルバム・ライブ・MVを支援しよう。", alternates: { canonical: "/projects/" } };
export const revalidate = 300;

export default async function ProjectsPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Eyebrow>Projects</Eyebrow>
      <h1 className="mt-1 text-2xl font-black tracking-[0.12em] sm:text-3xl">プロジェクトをさがす</h1>
      <BrowseNav />
      <Suspense>
        <ProjectExplorer projects={projects} artists={artists} />
      </Suspense>
    </div>
  );
}
