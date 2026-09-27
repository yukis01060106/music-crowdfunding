import Link from "next/link";
import type { MembershipPlan } from "@/types";
import { formatNumber, formatYen } from "@/lib/format";
import { isPlanFull } from "@/lib/membership";

/** 月額プラン1つ分。いちばん加入者の多いプランは枠で目立たせる */
export function PlanCard({
  plan,
  artistId,
  popular = false,
}: {
  plan: MembershipPlan;
  artistId: string;
  popular?: boolean;
}) {
  const full = isPlanFull(plan);
  const remaining = plan.limit === undefined ? undefined : plan.limit - plan.members;

  return (
    <div
      className={`relative flex flex-col border-[3px] bg-white p-5 text-ink ${
        popular && !full ? "border-brand" : "border-stone-200"
      } ${full ? "opacity-60" : ""}`}
    >
      {popular && !full && (
        <span className="absolute -top-3 left-4 bg-brand px-2 py-0.5 text-xs font-bold tracking-wider text-white">いちばん人気</span>
      )}
      <p className="font-bold tracking-wider">{plan.name}</p>
      <p className="mt-2">
        <span className="font-en text-3xl font-black">{formatYen(plan.price)}</span>
        <span className="ml-1 text-xs text-stone-500">/ 月（税込）</span>
      </p>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm text-stone-700">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex gap-2">
            <span className="text-brand" aria-hidden>
              ✓
            </span>
            {perk}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-stone-500">
        メンバー {formatNumber(plan.members)}人
        {remaining !== undefined && !full && `・残り${remaining}枠`}
      </p>
      {full ? (
        <p className="mt-3 bg-stone-100 py-2.5 text-center text-sm text-stone-500">満員</p>
      ) : (
        <Link
          href={`/artists/${artistId}/join?plan=${plan.id}`}
          className="mt-3 block bg-ink py-3 text-center text-sm font-bold tracking-wider text-white hover:bg-brand"
        >
          このプランでメンバーになる
        </Link>
      )}
    </div>
  );
}

/** 加入者がいちばん多い、まだ入れるプラン */
export function mostPopularPlanId(plans: MembershipPlan[]): string | undefined {
  return plans.filter((p) => !isPlanFull(p)).sort((a, b) => b.members - a.members)[0]?.id;
}
