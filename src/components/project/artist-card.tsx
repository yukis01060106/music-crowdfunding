import Link from "next/link";
import type { Artist } from "@/types";
import { tagClass } from "@/components/ui/tag";
import { ARTIST_TYPE_LABELS } from "@/types";
import { Photo } from "@/components/ui/photo";
import { VerifiedBadge } from "./verified-badge";
import { ArrowRight, ICON } from "@/components/ui/icon";
import { formatYen } from "@/lib/format";

/** 「この人なら信頼できる」と思えるよう、実行者の顔とこれまでの活動を見せる */
export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <section className="border-[3px] border-ink/10 bg-white p-5">
      <h2 className="text-xs font-bold text-stone-500">このプロジェクトの実行者</h2>
      <div className="mt-3 flex gap-4">
        <span className="relative h-20 w-20 shrink-0 overflow-hidden">
          <Photo src={artist.photo} alt="" sizes="80px" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {artist.name}
            <VerifiedBadge verified={artist.verified} />
          </p>
          <p className="mt-1 flex flex-wrap gap-1">
            {artist.types.map((t) => (
              <span key={t} className={tagClass()}>
                {ARTIST_TYPE_LABELS[t]}
              </span>
            ))}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{artist.bio}</p>
          <Link href={`/artists/${artist.id}`} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-brand hover:underline">
            <span>
              プロフィールとほかのプロジェクト
              <ArrowRight {...ICON} className="ml-1 inline size-4 align-[-0.15em]" />
            </span>
          </Link>
        </div>
      </div>
      {/* プロジェクトの合間も応援できる入口（支援の邪魔をしないよう、カードの中に控えめに） */}
      {artist.membership && artist.membership.plans.length > 0 && (
        <Link href={`/artists/${artist.id}/join`} className="mt-4 flex min-h-11 items-center justify-between gap-3 bg-brand-soft px-4 py-3 text-sm transition hover:bg-brand hover:text-white">
          <span>
            <span className="font-bold">月額{formatYen(Math.min(...artist.membership.plans.map((p) => p.price)))}から</span>
            、メンバーになって毎月応援する
          </span>
          <ArrowRight {...ICON} className="size-4 shrink-0" />
        </Link>
      )}
    </section>
  );
}
