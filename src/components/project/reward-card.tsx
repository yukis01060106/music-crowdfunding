import Link from "next/link";
import type { Reward } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatNumber, formatYen } from "@/lib/format";

export function RewardCard({ reward, projectSlug }: { reward: Reward; projectSlug: string }) {
  const soldOut = reward.limit !== undefined && reward.backers >= reward.limit;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold">{reward.price === 0 ? "0円" : formatYen(reward.price)}</span>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">
          {REWARD_KIND_LABELS[reward.kind]}
        </span>
      </div>
      <h3 className="mt-2 font-bold">{reward.title}</h3>
      <p className="mt-1 text-sm text-stone-600">{reward.description}</p>
      <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-stone-500">
        <dt>支援者</dt>
        <dd className="text-right">{formatNumber(reward.backers)}人</dd>
        <dt>お届け予定</dt>
        <dd className="text-right">{reward.deliveryEstimate}</dd>
        {reward.limit !== undefined && (
          <>
            <dt>残り</dt>
            <dd className="text-right">{soldOut ? "なし" : `${reward.limit - reward.backers}個`}</dd>
          </>
        )}
      </dl>
      {soldOut ? (
        <p className="mt-4 rounded-lg bg-stone-100 py-2 text-center text-sm text-stone-500">受付終了</p>
      ) : (
        <Link
          href={`/projects/${projectSlug}/support?reward=${reward.id}`}
          className="mt-4 block rounded-lg bg-brand py-2 text-center text-sm font-medium text-white hover:bg-brand-dark"
        >
          {reward.price === 0 ? "0円で参加する" : "このリターンを選ぶ"}
        </Link>
      )}
    </div>
  );
}
