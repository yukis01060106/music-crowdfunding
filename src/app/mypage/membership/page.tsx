import Link from "next/link";
import { getArtists } from "@/lib/data";
import { formatDate, formatYen } from "@/lib/format";
import { PageTitle } from "@/components/side-nav";
import { Photo } from "@/components/ui/photo";

// モック: ログイン中のユーザーが加入しているメンバーシップ
const subscriptions = [
  { artistId: "hoshizora-radio", planId: "m-crew", joinedAt: "2026-04-12T20:00:00+09:00", nextBillingAt: "2026-10-12T00:00:00+09:00" },
  { artistId: "yumenoa", planId: "m-listener", joinedAt: "2026-08-30T22:10:00+09:00", nextBillingAt: "2026-09-30T00:00:00+09:00" },
];

/** 加入からの月数。「メンバー歴」として出す */
function monthsSince(iso: string, now = new Date("2026-09-27T00:00:00+09:00")): number {
  const d = new Date(iso);
  return (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
}

export default async function MyMembershipPage() {
  const artists = await getArtists();
  const rows = subscriptions.flatMap((s) => {
    const artist = artists.find((a) => a.id === s.artistId);
    const plan = artist?.membership?.plans.find((p) => p.id === s.planId);
    return artist && plan ? [{ ...s, artist, plan }] : [];
  });
  const monthlyTotal = rows.reduce((sum, r) => sum + r.plan.price, 0);

  return (
    <>
      <PageTitle>加入中のメンバーシップ</PageTitle>
      <p className="mb-6 text-sm text-stone-600">
        毎月のお支払い合計 <span className="text-lg font-bold text-ink">{formatYen(monthlyTotal)}</span>
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.artistId} className="flex flex-col gap-4 border border-stone-200 bg-white p-4 sm:flex-row">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden">
              <Photo src={r.artist.photo} alt="" sizes="80px" />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/artists/${r.artist.id}`} className="font-bold hover:text-brand">
                {r.artist.name}
              </Link>
              <p className="text-sm text-stone-600">
                {r.plan.name}・{formatYen(r.plan.price)} / 月
                <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand">メンバー歴 {monthsSince(r.joinedAt)}か月</span>
              </p>
              <p className="mt-1 text-xs text-stone-500">次回のお支払い {formatDate(r.nextBillingAt)}</p>
            </div>
            <div className="flex gap-2 self-start text-sm">
              {/* TODO: Stripe Billing のカスタマーポータルに飛ばす */}
              <Link href={`/artists/${r.artist.id}/join?plan=${r.plan.id}`} className="border border-stone-300 px-3 py-1.5 hover:bg-stone-100">
                プラン変更
              </Link>
              <button type="button" className="border border-stone-300 px-3 py-1.5 text-stone-500 hover:bg-stone-100">
                解約
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-stone-500">解約しても、次の更新日の前日まで特典を使えます。</p>
      <Link href="/membership" className="mt-6 inline-block text-sm font-bold text-brand hover:underline">
        ほかのアーティストのメンバーシップを見る →
      </Link>
    </>
  );
}
