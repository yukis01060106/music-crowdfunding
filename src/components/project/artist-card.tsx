import Link from "next/link";
import type { Artist } from "@/types";
import { ARTIST_TYPE_LABELS } from "@/types";
import { Photo } from "@/components/ui/photo";
import { VerifiedBadge } from "./verified-badge";

/** 「この人なら信頼できる」と思えるよう、実行者の顔とこれまでの活動を見せる */
export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <section className="border border-stone-200 bg-white p-5">
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
              <span key={t} className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">
                {ARTIST_TYPE_LABELS[t]}
              </span>
            ))}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{artist.bio}</p>
          <Link href={`/artists/${artist.id}`} className="mt-2 inline-block text-sm text-brand hover:underline">
            プロフィールとほかのプロジェクト →
          </Link>
        </div>
      </div>
    </section>
  );
}
