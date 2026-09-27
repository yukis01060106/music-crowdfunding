import Link from "next/link";
import type { Project } from "@/types";
import { Photo } from "@/components/ui/photo";

/** 支援者の応援コメントを、吹き出しのように横へ流す */
export function VoicesMarquee({ projects }: { projects: Project[] }) {
  const voices = projects.flatMap((p) => p.comments.map((c) => ({ ...c, project: p })));
  if (voices.length === 0) return null;

  return (
    <div className="overflow-hidden py-2">
      <ul className="flex w-max animate-marquee-left gap-5 hover:[animation-play-state:paused]">
        {[...voices, ...voices].map((v, i) => (
          <li key={`${v.project.slug}-${v.id}-${i}`} aria-hidden={i >= voices.length}>
            <Link
              href={`/projects/${v.project.slug}/comments`}
              tabIndex={i >= voices.length ? -1 : undefined}
              className="flex w-[380px] items-center gap-4 rounded-full bg-stone-100 py-3 pl-3 pr-8 hover:bg-brand-soft"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                <Photo src={v.project.cover} alt="" sizes="64px" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-stone-500">{v.userName}さん</span>
                <span className="line-clamp-2 text-sm font-bold leading-snug">{v.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
