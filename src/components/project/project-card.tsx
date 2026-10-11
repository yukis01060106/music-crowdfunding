import Link from "next/link";
import type { Artist, Project } from "@/types";
import { LiveAmount, LiveBackers, LivePercent, LiveProgressBar } from "./live-figures";
import { tagClass } from "@/components/ui/tag";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";

import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";
import { formatYen } from "@/lib/format";
import { DaysLeft } from "./days-left";
import { StatusBadges } from "./status-badges";
import { VerifiedBadge } from "./verified-badge";
import { SuspendedCardBadge } from "./support-cta";

/** 黒い背景の上のカードの枠色（ホームのアーティスト）。白い背景の一覧では使わない */
export const FRAME_COLORS = ["border-pop-yellow", "border-pop-pink", "border-pop-blue", "border-pop-teal"] as const;

/** 写真の角に置く図形。差し色は図形だけに使う（決まり）。並び順でめぐる */
const ACCENTS = [
  { shape: "circle", color: "yellow" },
  { shape: "square", color: "pink" },
  { shape: "triangle", color: "blue" },
  { shape: "circle", color: "teal" },
] as const;

/** いちばん安い有料のリターン（0円のプランがあれば 0） */
function startingPrice(project: Project): number | null {
  if (project.rewards.some((r) => r.price === 0)) return 0;
  const paid = project.rewards.filter((r) => r.price > 0 && (r.limit === undefined || r.backers < r.limit)).map((r) => r.price);
  return paid.length > 0 ? Math.min(...paid) : null;
}

export function ProjectCard({ project, artist, index = 0 }: { project: Project; artist?: Artist; index?: number }) {
  const from = startingPrice(project);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative flex flex-col border-[3px] border-ink/10 bg-white p-3 transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink hover:shadow-sticker"
    >
      <Sticker shape={ACCENTS[index % ACCENTS.length].shape} color={ACCENTS[index % ACCENTS.length].color} size={26} className="-left-2.5 -top-2.5 z-10 transition-transform duration-300 group-hover:rotate-12" />
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${project.color}`}>
        <Photo
          src={project.cover}
          alt=""
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <StatusBadges project={project} className="absolute left-0 top-0" />
        <SuspendedCardBadge slug={project.slug} />
        <span className="absolute bottom-2 right-2 bg-white px-2 py-0.5 text-[11px] font-bold tracking-wider">
          {GENRE_LABELS[project.genre]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-1 pb-1 pt-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
          <span className="font-bold text-ink">{artist?.name}</span>
          {artist && <VerifiedBadge verified={artist.verified} />}
          {artist?.types.map((t) => (
            <span key={t} className={tagClass()}>
              {ARTIST_TYPE_LABELS[t]}
            </span>
          ))}
        </p>
        <h3 className="line-clamp-2 font-bold leading-snug tracking-wide group-hover:text-brand">{project.title}</h3>
        <div className="mt-auto space-y-2">
          <LiveProgressBar project={project} />
          <div className="flex items-end justify-between">
            <span className="font-en text-lg font-bold">
              <LiveAmount project={project} />
            </span>
            <LivePercent project={project} className="font-en text-lg font-black" />
          </div>
          <p className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-stone-500">
            <span>
              残り <DaysLeft endAt={project.endAt} />・<LiveBackers project={project} />人が支援
            </span>
            {from !== null && <span className="font-bold text-ink">{from === 0 ? "0円から参加できる" : `${formatYen(from)}から支援できる`}</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
