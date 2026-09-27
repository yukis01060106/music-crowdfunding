import type { Metadata } from "next";
import { getArtists, getPublicProjects } from "@/lib/data";
import { BrowseNav } from "@/components/project/browse-nav";
import { ProjectExplorer } from "@/components/project/project-explorer";

export const metadata: Metadata = { title: "プロジェクトをさがす" };
export const revalidate = 300;

export default async function ProjectsPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-en text-xs font-medium tracking-wide text-stone-500">Projects</p>
      <h1 className="mt-1 text-3xl font-black tracking-[0.12em]">プロジェクトをさがす</h1>
      <BrowseNav />
      <ProjectExplorer projects={projects} artists={artists} />
    </div>
  );
}
