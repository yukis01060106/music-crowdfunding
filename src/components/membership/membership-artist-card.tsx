import Link from "next/link";
import type { Artist, Membership } from "@/types";
import { formatNumber, formatYen } from "@/lib/format";
import { lowestPlanPrice, totalMembers } from "@/lib/membership";
import { Photo } from "@/components/ui/photo";

/** メンバーシップを開設しているアーティスト。最安の月額とメンバー数を出す */
export function MembershipArtistCard({ artist, membership }: { artist: Artist; membership: Membership }) {
  return (
    <Link href={`/artists/${artist.id}#membership`} className="group block bg-white text-ink">
      <span className="relative block aspect-[4/5] overflow-hidden">
        <Photo src={artist.photo} alt={artist.name} sizes="(min-width: 1024px) 260px, 45vw" className="transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute bottom-0 left-0 bg-pop-yellow px-3 py-1 font-en text-sm font-black">
          {formatYen(lowestPlanPrice(membership))}〜<span className="text-[10px] font-bold">/月</span>
        </span>
      </span>
      <span className="block p-3">
        <span className="block truncate font-bold tracking-wider">{artist.name}</span>
        <span className="mt-0.5 block text-[11px] text-stone-500">メンバー {formatNumber(totalMembers(membership))}人</span>
      </span>
    </Link>
  );
}
