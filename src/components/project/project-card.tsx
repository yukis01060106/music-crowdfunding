import Link from "next/link";
import type { Artist, Project } from "@/types";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";
import { Photo } from "@/components/ui/photo";
import { ProgressBar } from "./progress";
import { DaysLeft } from "./days-left";
import { StatusBadges } from "./status-badges";
import { VerifiedBadge } from "./verified-badge";

/** カードの枠色。並び順で黄→ピンク→青→緑とめぐる */
export const FRAME_COLORS = ["border-pop-yellow", "border-pop-pink", "border-pop-blue", "border-pop-teal"] as const;

export function ProjectCard({ project, artist, index = 0 }: { project: Project; artist?: Artist; index?: number }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group flex flex-col border-[3px] bg-white p-3 transition-transform hover:-translate-y-1 ${FRAME_COLORS[index % FRAME_COLORS.length]}`}
    >
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${project.color}`}>
        <Photo
          src={project.cover}
          alt=""
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <StatusBadges project={project} className="absolute left-0 top-0" />
        <span className="absolute bottom-2 right-2 bg-white px-2 py-0.5 text-[11px] font-bold tracking-wider">
          {GENRE_LABELS[project.genre]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-1 pb-1 pt-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
          <span className="font-bold text-ink">{artist?.name}</span>
          {artist && <VerifiedBadge verified={artist.verified} />}
          {artist?.types.map((t) => (
            <span key={t} className="border border-stone-300 px-1.5 py-px text-[11px]">
              {ARTIST_TYPE_LABELS[t]}
            </span>
          ))}
        </p>
        <h3 className="line-clamp-2 font-bold leading-snug tracking-wide group-hover:text-brand">{project.title}</h3>
        <div className="mt-auto space-y-2">
          <ProgressBar project={project} />
          <div className="flex items-end justify-between">
            <span className="font-en text-lg font-bold">
              {project.goalType === "participants"
                ? `${formatNumber(project.backers)}人`
                : formatYen(project.raised)}
            </span>
            <span className="font-en text-lg font-black text-brand">{progressPercent(project)}%</span>
          </div>
          <p className="text-xs text-stone-500">
            残り <DaysLeft endAt={project.endAt} />・{formatNumber(project.backers)}人が支援
          </p>
        </div>
      </div>
    </Link>
  );
}
