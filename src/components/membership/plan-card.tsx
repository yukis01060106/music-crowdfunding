import Link from "next/link";
import type { MembershipPlan } from "@/types";
import { formatNumber, formatYen } from "@/lib/format";
import { isPlanFull } from "@/lib/membership";
import { buttonClass } from "@/components/ui/button";
import { Check, ICON } from "@/components/ui/icon";

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
  // いちばん人気のプランは色を反転させて、主役にする
  const featured = popular && !full;

  return (
    <div
      className={`relative flex flex-col border-[3px] p-5 transition duration-200 ${
        full ? "border-stone-200 bg-stone-50 text-ink" : featured ? "border-ink bg-ink text-white shadow-sticker-brand" : "border-ink/10 bg-white text-ink hover:border-ink hover:shadow-sticker-sm"
      }`}
    >
      {featured && <span className="absolute -top-3 left-4 bg-pop-yellow px-2 py-0.5 text-xs font-bold tracking-wider text-ink">いちばん人気</span>}
      <p className="font-bold tracking-wider">{plan.name}</p>
      <p className="mt-2">
        <span className={`font-en text-3xl font-black ${featured ? "text-pop-yellow" : ""}`}>{formatYen(plan.price)}</span>
        <span className={`ml-1 text-xs ${featured ? "text-white/70" : "text-stone-500"}`}>/ 月（税込）</span>
      </p>
      <ul className={`mt-4 flex-1 space-y-1.5 text-sm ${featured ? "text-white/90" : "text-stone-700"}`}>
        {plan.perks.map((perk) => (
          <li key={perk} className="flex gap-2">
            <Check {...ICON} className={`mt-0.5 size-4 shrink-0 ${featured ? "text-pop-yellow" : "text-brand"}`} />
            {perk}
          </li>
        ))}
      </ul>
      <p className={`mt-4 text-xs ${featured ? "text-white/70" : "text-stone-500"}`}>
        メンバー {formatNumber(plan.members)}人
        {remaining !== undefined && !full && `・残り${remaining}枠`}
      </p>
      {full ? (
        <p className="mt-3 bg-stone-100 py-2.5 text-center text-sm text-stone-500">満員</p>
      ) : (
        <Link
          href={`/artists/${artistId}/join?plan=${plan.id}`}
          className={buttonClass(featured ? "onDark" : "secondary", "md", "mt-3 w-full")}
        >
          メンバーになる
        </Link>
      )}
    </div>
  );
}

/** 加入者がいちばん多い、まだ入れるプラン */
export function mostPopularPlanId(plans: MembershipPlan[]): string | undefined {
  return plans.filter((p) => !isPlanFull(p)).sort((a, b) => b.members - a.members)[0]?.id;
}
