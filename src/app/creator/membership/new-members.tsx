"use client";

import { useDemo, useHydrated } from "@/lib/demo-store";
import { formatDate, formatYen } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";
import type { MembershipPlan } from "@/types";

/** このブラウザの支援者が加入したメンバーシップ（支援者の画面での加入・解約が、ここに届く） */
export function NewMembers({ artistId, plans }: { artistId: string; plans: MembershipPlan[] }) {
  const { memberships, user } = useDemo();
  const hydrated = useHydrated();
  const mine = memberships.filter((m) => m.artistId === artistId);
  if (!hydrated || !user || mine.length === 0) return null;
  return (
    <section className="mb-6 border border-stone-200 bg-white p-4 text-sm">
      <h2 className="mb-2 font-bold">このブラウザの支援者のメンバーシップ</h2>
      <ul className="space-y-1">
        {mine.map((m) => {
          const plan = plans.find((p) => p.id === m.planId);
          return (
            <li key={m.artistId} className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{user.name}さん</span>
              <span className="text-stone-600">
                {plan?.name}（{plan ? formatYen(plan.price) : ""} / 月）・{formatDate(m.joinedAt)} 加入
              </span>
              {m.canceledAt ? <span className={tagClass("neutral")}>解約予定（次の更新日の前日まで特典あり）</span> : <span className={tagClass("success")}>加入中</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
