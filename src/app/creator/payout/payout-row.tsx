"use client";

import type { Project } from "@/types";
import { liveTotals, payableRaised, payoutIfReached, useNewBackings } from "@/lib/backing-state";
import { formatDate, formatYen, progressPercent } from "@/lib/format";
import { feeAmount, payoutAmount, PAYOUT_DAYS } from "@/lib/fees";
import { useNow } from "@/lib/use-now";

/** 入金予定の1行。ダッシュボードと同じ数え方（このブラウザの有効な支援を足し、返金を除く。目標未達の All-or-Nothing は 0） */
export function PayoutRow({ project: p }: { project: Project }) {
  const now = useNow();
  const added = useNewBackings(p.slug, now).filter((b) => !b.refunded);
  const live = liveTotals(p, added);
  const percent = progressPercent(live);
  const payable = payableRaised(live, percent);
  const payDate = new Date(new Date(p.endAt).getTime() + PAYOUT_DAYS * 86_400_000).toISOString();
  return (
    <tr>
      <td className="p-3 font-medium">{p.title}</td>
      <td className="p-3 text-right">{formatYen(live.raised)}</td>
      <td className="p-3 text-right text-stone-500">−{formatYen(feeAmount(payable))}</td>
      <td className="p-3 text-right font-bold">
        {formatYen(payoutAmount(payable))}
        {payable === 0 && live.raised > 0 && <span className="block text-xs font-normal text-stone-500">達成すれば {formatYen(payoutIfReached(live, payoutAmount))} 以上</span>}
      </td>
      <td className="p-3 text-xs text-stone-500">{payable > 0 ? `${formatDate(payDate)}ごろ` : "目標達成時のみ"}</td>
    </tr>
  );
}
