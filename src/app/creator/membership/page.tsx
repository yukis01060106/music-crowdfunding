import { getArtist } from "@/lib/data";
import { formatNumber, formatYen } from "@/lib/format";
import { payoutAmount } from "@/lib/fees";
import { totalMembers } from "@/lib/membership";
import { PageTitle } from "@/components/side-nav";
import { MembershipEditor } from "./membership-editor";

import { CREATOR_ARTIST_ID as CURRENT_ARTIST_ID } from "../creator-context";
import { NewMembers } from "./new-members";

export default async function CreatorMembershipPage() {
  const artist = await getArtist(CURRENT_ARTIST_ID);
  if (!artist) return null;
  const membership = artist.membership;
  const monthly = membership ? membership.plans.reduce((sum, p) => sum + p.price * p.members, 0) : 0;

  return (
    <>
      <PageTitle>メンバーシップ設定</PageTitle>
      {membership && (
        <div data-stagger className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kpi label="メンバー" value={`${formatNumber(totalMembers(membership))}人`} />
          <Kpi label="今月の売上" value={formatYen(monthly)} />
          <Kpi label="受け取り（手数料引き後）" value={formatYen(payoutAmount(monthly))} />
        </div>
      )}
      {membership && <NewMembers artistId={artist.id} plans={membership.plans} />}
      <MembershipEditor artistId={artist.id} artistName={artist.name} initial={membership} />
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-en text-xl font-black">{value}</p>
    </div>
  );
}
