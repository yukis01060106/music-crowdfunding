import Link from "next/link";
import type { Artist, Project } from "@/types";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";
import { ProgressBar } from "./progress";
import { DaysLeft } from "./days-left";

export function ProjectCard({ project, artist }: { project: Project; artist?: Artist }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-md"
    >
      <div className={`aspect-video bg-gradient-to-br ${project.color} p-4`}>
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700">
          {GENRE_LABELS[project.genre]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
          {artist?.name}
          {artist?.types.map((t) => (
            <span key={t} className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
              {ARTIST_TYPE_LABELS[t]}
            </span>
          ))}
        </p>
        <h3 className="line-clamp-2 font-bold leading-snug group-hover:text-brand">{project.title}</h3>
        <div className="mt-auto space-y-2">
          <ProgressBar project={project} />
          <div className="flex items-end justify-between text-sm">
            <span className="font-bold">
              {project.goalType === "participants"
                ? `${formatNumber(project.backers)}人`
                : formatYen(project.raised)}
            </span>
            <span className="font-bold text-brand">{progressPercent(project)}%</span>
          </div>
          <p className="text-xs text-stone-500">
            残り <DaysLeft endAt={project.endAt} />
          </p>
        </div>
      </div>
    </Link>
  );
}
