"use client";

import Link from "next/link";
import { useState } from "react";
import type { Artist } from "@/types";
import { formatDate, formatYen } from "@/lib/format";
import { cancelMembership, resumeMembership, useDemo } from "@/lib/demo-store";
import { useNow } from "@/lib/use-now";
import { Photo } from "@/components/ui/photo";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

/** 加入日から見た、次の更新日（毎月同じ日） */
function nextBilling(joinedAt: string, now: number): Date {
  const joined = new Date(joinedAt);
  const d = new Date(now);
  const next = new Date(d.getFullYear(), d.getMonth(), joined.getDate());
  if (next.getTime() <= now) next.setMonth(next.getMonth() + 1);
  return next;
}

function monthsSince(iso: string, now: number): number {
  const d = new Date(iso);
  const n = new Date(now);
  return Math.max(0, (n.getFullYear() - d.getFullYear()) * 12 + n.getMonth() - d.getMonth());
}

export function Subscriptions({ artists }: { artists: Artist[] }) {
  const { memberships } = useDemo();
  const now = useNow();
  const [canceling, setCanceling] = useState<string | null>(null);

  const rows = memberships.flatMap((m) => {
    const artist = artists.find((a) => a.id === m.artistId);
    const plan = artist?.membership?.plans.find((p) => p.id === m.planId);
    return artist && plan ? [{ ...m, artist, plan }] : [];
  });
  const monthlyTotal = rows.filter((r) => !r.canceledAt).reduce((sum, r) => sum + r.plan.price, 0);
  const target = rows.find((r) => r.artistId === canceling);

  if (rows.length === 0) {
    return (
      <div className="border-2 border-dashed border-stone-300 p-10 text-center">
        <p className="text-stone-500">加入しているメンバーシップはありません。</p>
        <Link href="/membership" className="mt-4 inline-block bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-brand">
          メンバーシップをさがす
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-stone-600">
        毎月のお支払い合計 <span className="font-en text-xl font-black text-ink">{formatYen(monthlyTotal)}</span>
      </p>
      <ul className="space-y-3">
        {rows.map((r) => {
          const next = now !== null ? nextBilling(r.joinedAt, now) : null;
          return (
            <li key={r.artistId} className={`animate-rise flex flex-col gap-4 border bg-white p-4 sm:flex-row ${r.canceledAt ? "border-stone-200 opacity-80" : "border-stone-200"}`}>
              <Link href={`/artists/${r.artist.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
                <Photo src={r.artist.photo} alt="" sizes="80px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/artists/${r.artist.id}`} className="font-bold hover:text-brand">
                  {r.artist.name}
                </Link>
                <p className="text-sm text-stone-600">
                  {r.plan.name}・{formatYen(r.plan.price)} / 月
                  {now !== null && <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand">メンバー歴 {monthsSince(r.joinedAt, now)}か月</span>}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {r.canceledAt
                    ? `解約済み。${next ? `${formatDate(next.toISOString())}の前日まで` : "次の更新日の前日まで"}特典を使えます`
                    : next && `次回のお支払い ${formatDate(next.toISOString())}`}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {r.plan.perks.map((perk) => (
                    <li key={perk} className="bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 gap-2 self-start text-sm sm:flex-col">
                {r.canceledAt ? (
                  <button
                    type="button"
                    onClick={() => {
                      resumeMembership(r.artistId);
                      toast("メンバーシップを再開しました");
                    }}
                    className="bg-brand px-3 py-1.5 font-bold text-white hover:bg-brand-dark"
                  >
                    再開する
                  </button>
                ) : (
                  <>
                    <Link href={`/artists/${r.artist.id}/join?plan=${r.plan.id}`} className="border border-stone-300 px-3 py-1.5 text-center hover:bg-stone-100">
                      プラン変更
                    </Link>
                    <button type="button" onClick={() => setCanceling(r.artistId)} className="border border-stone-300 px-3 py-1.5 text-stone-500 hover:border-rose-300 hover:text-rose-600">
                      解約
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-stone-500">解約しても、次の更新日の前日まで特典を使えます。日割りでの返金はありません。</p>
      <Link href="/membership" className="mt-6 inline-block text-sm font-bold text-brand hover:underline">
        ほかのアーティストのメンバーシップを見る →
      </Link>

      <ConfirmDialog
        open={target !== undefined}
        onClose={() => setCanceling(null)}
        onConfirm={() => {
          if (!target) return;
          cancelMembership(target.artistId);
          toast("解約を受け付けました");
        }}
        title={`${target?.artist.name}のメンバーシップを解約しますか？`}
        body={
          <>
            <p>次の更新日の前日まで、特典はそのまま使えます。それ以降のお支払いは発生しません。</p>
            <p className="mt-2">解約後も、いつでも再開できます。</p>
          </>
        }
        confirmLabel="解約する"
        danger
      />
    </>
  );
}
