import Link from "next/link";
import type { Artist, Project } from "@/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects, artists }: { projects: Project[]; artists: Artist[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center">
        <p className="text-stone-500">該当するプロジェクトはまだありません。</p>
        <Link href="/projects" className="mt-3 inline-block text-sm text-brand hover:underline">
          すべてのプロジェクトを見る
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard
          key={p.slug}
          project={p}
          artist={artists.find((a) => a.id === p.artistId)}
        />
      ))}
    </div>
  );
}
