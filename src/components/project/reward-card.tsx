import Link from "next/link";
import type { Reward } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatNumber, formatYen } from "@/lib/format";

/** 在庫が残りこの数以下になったら「残りわずか」と出す */
const LOW_STOCK = 10;

export function RewardCard({
  reward,
  projectSlug,
  popular = false,
}: {
  reward: Reward;
  projectSlug: string;
  /** そのプロジェクトで最も選ばれているリターン */
  popular?: boolean;
}) {
  const remaining = reward.limit === undefined ? undefined : reward.limit - reward.backers;
  const soldOut = remaining !== undefined && remaining <= 0;

  return (
    <div
      className={`relative rounded-xl border bg-white p-4 ${
        popular && !soldOut ? "border-brand ring-1 ring-brand" : "border-stone-200"
      } ${soldOut ? "opacity-60" : ""}`}
    >
      {popular && !soldOut && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
          人気No.1
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-2xl font-bold">{reward.price === 0 ? "0円" : formatYen(reward.price)}</span>
          {reward.price > 0 && <span className="ml-1 text-xs text-stone-500">税込・送料込み</span>}
        </div>
        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">
          {REWARD_KIND_LABELS[reward.kind]}
        </span>
      </div>
      <h3 className="mt-2 font-bold leading-snug">{reward.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">{reward.description}</p>

      <dl className="mt-3 grid grid-cols-2 gap-1 border-t border-stone-100 pt-3 text-xs text-stone-500">
        <dt>お届け予定</dt>
        <dd className="text-right font-medium text-stone-700">{reward.deliveryEstimate}</dd>
        <dt>支援者</dt>
        <dd className="text-right">{formatNumber(reward.backers)}人</dd>
        {remaining !== undefined && (
          <>
            <dt>残り</dt>
            <dd className={`text-right ${!soldOut && remaining <= LOW_STOCK ? "font-bold text-rose-600" : ""}`}>
              {soldOut ? "なし" : `${remaining}個${remaining <= LOW_STOCK ? "（残りわずか）" : ""}`}
            </dd>
          </>
        )}
      </dl>

      {soldOut ? (
        <p className="mt-4 rounded-lg bg-stone-100 py-2.5 text-center text-sm text-stone-500">受付終了</p>
      ) : (
        <Link
          href={`/projects/${projectSlug}/support?reward=${reward.id}`}
          className="mt-4 block rounded-lg bg-brand py-2.5 text-center text-sm font-bold text-white hover:bg-brand-dark"
        >
          {reward.price === 0 ? "0円で参加する" : "このリターンで支援する"}
        </Link>
      )}
    </div>
  );
}

/** 最も支援者の多い、まだ選べる有料リターン */
export function mostPopularRewardId(rewards: Reward[]): string | undefined {
  return rewards
    .filter((r) => r.price > 0 && (r.limit === undefined || r.backers < r.limit))
    .sort((a, b) => b.backers - a.backers)[0]?.id;
}
