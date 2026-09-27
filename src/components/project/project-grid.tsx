import type { Artist, Project } from "@/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects, artists }: { projects: Project[]; artists: Artist[] }) {
  if (projects.length === 0) {
    return <p className="py-16 text-center text-stone-500">まだプロジェクトはありません。</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard
          key={p.slug}
          project={p}
          artistName={artists.find((a) => a.id === p.artistId)?.name ?? ""}
        />
      ))}
    </div>
  );
}
