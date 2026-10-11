import type { Project, Reward } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatNumber, formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { tagClass } from "@/components/ui/tag";
import { SupportCta } from "./support-cta";

/** 在庫が残りこの数以下になったら、残り数を強調する（「残りわずか」とはあおらない） */
const LOW_STOCK = 3;

export function RewardCard({
  reward,
  project,
  popular = false,
}: {
  reward: Reward;
  project: Pick<Project, "slug" | "status" | "endAt">;
  /** そのプロジェクトで最も選ばれているリターン */
  popular?: boolean;
}) {
  const remaining = reward.limit === undefined ? undefined : reward.limit - reward.backers;
  const soldOut = remaining !== undefined && remaining <= 0;

  return (
    <div
      className={`relative border-[3px] p-4 transition duration-200 ${soldOut ? "border-stone-200 bg-stone-50" : popular ? "border-brand bg-white shadow-sticker-brand" : "border-ink/10 bg-white hover:border-ink hover:shadow-sticker-sm"}`}
    >
      {popular && !soldOut && <span className="absolute -top-3 left-4 bg-brand px-2 py-0.5 text-xs font-bold tracking-wider text-white">いちばん人気</span>}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-en text-2xl font-black">{formatPrice(reward.price)}</span>
          {reward.price > 0 && <span className="ml-1 text-xs text-stone-500">税込・送料込み</span>}
        </div>
        <span className={tagClass("brand")}>{REWARD_KIND_LABELS[reward.kind]}</span>
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
            <dd className={`text-right ${!soldOut && remaining <= LOW_STOCK ? "font-bold text-ink" : ""}`}>{soldOut ? "なし" : `${remaining}個`}</dd>
          </>
        )}
      </dl>

      {soldOut ? (
        <p className="mt-4 bg-stone-100 py-2.5 text-center text-sm text-stone-600">受付終了</p>
      ) : (
        // いちばん人気だけを強いボタンにして、主な行動をはっきりさせる
        <SupportCta project={project} href={`/projects/${project.slug}/support?reward=${reward.id}`} className={buttonClass(popular ? "primary" : "secondary", "md", "mt-4 w-full")}>
          {reward.price === 0 ? "0円で参加する" : "このリターンで支援する"}
        </SupportCta>
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
