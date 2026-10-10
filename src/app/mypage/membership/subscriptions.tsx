"use client";

import Link from "next/link";
import { useState } from "react";
import type { Artist } from "@/types";
import { formatDate, formatYen } from "@/lib/format";
import { lastBenefitDay, nextBillingDate } from "@/lib/membership";
import { cancelMembership, resumeMembership, useDemo } from "@/lib/demo-store";
import { useNow } from "@/lib/use-now";
import { Photo } from "@/components/ui/photo";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { STRIPE_ENABLED, updateMembership } from "@/lib/payments";
import { buttonClass } from "@/components/ui/button";

/** メンバー歴（か月）。日本時間の年月で数える */
function monthsSince(iso: string, now: number): number {
  const jst = (ms: number) => new Date(ms + 9 * 60 * 60 * 1000);
  const d = jst(new Date(iso).getTime());
  const n = jst(now);
  return Math.max(0, (n.getUTCFullYear() - d.getUTCFullYear()) * 12 + n.getUTCMonth() - d.getUTCMonth());
}

export function Subscriptions({ artists }: { artists: Artist[] }) {
  const { memberships } = useDemo();
  const now = useNow();
  const [canceling, setCanceling] = useState<string | null>(null);
  // Stripe と通信している行（二重に押せないようにする）
  const [busy, setBusy] = useState<string | null>(null);

  const rows = memberships.flatMap((m) => {
    const artist = artists.find((a) => a.id === m.artistId);
    const plan = artist?.membership?.plans.find((p) => p.id === m.planId);
    const pendingPlan = artist?.membership?.plans.find((p) => p.id === m.pendingPlanId);
    return artist && plan ? [{ ...m, artist, plan, pendingPlan }] : [];
  });
  const monthlyTotal = rows.filter((r) => !r.canceledAt).reduce((sum, r) => sum + r.plan.price, 0);
  const target = rows.find((r) => r.artistId === canceling);

  if (rows.length === 0) {
    return (
      <div className="border-2 border-dashed border-stone-300 p-10 text-center">
        <p className="text-stone-500">加入しているメンバーシップはありません。</p>
        <Link href="/membership" className={buttonClass("primary", "md", "mt-4")}>
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
          const next = now !== null ? nextBillingDate(r.joinedAt, now) : null;
          // 解約後に特典を使える期限は、解約した日から見た次の更新日の前日で固定する（日がたっても動かない）
          const lastDay = r.canceledAt ? lastBenefitDay(r.joinedAt, new Date(r.canceledAt).getTime()) : null;
          const ended = lastDay !== null && now !== null && now >= lastDay.getTime() + 24 * 60 * 60 * 1000;
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
                  {now !== null && !ended && <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand">メンバー歴 {monthsSince(r.joinedAt, now)}か月</span>}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {r.canceledAt
                    ? ended && lastDay
                      ? `メンバーシップは終了しました（${formatDate(lastDay.toISOString())}まで）`
                      : `解約済み。${lastDay ? `${formatDate(lastDay.toISOString())}まで` : "次の更新日の前日まで"}特典を使えます`
                    : next && `次回のお支払い ${formatDate(next.toISOString())}`}
                  {!r.canceledAt && r.pendingPlan && next && (
                    <span className="mt-1 block font-bold text-brand">
                      {formatDate(next.toISOString())}から{r.pendingPlan.name}プラン（{formatYen(r.pendingPlan.price)} / 月）に変わります
                    </span>
                  )}
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
                {r.canceledAt && ended ? (
                  <Link href={`/artists/${r.artist.id}/join?plan=${r.plan.id}`} className="inline-flex min-h-11 items-center bg-brand px-3 font-bold text-white hover:bg-brand-dark">
                    もう一度加入する
                  </Link>
                ) : r.canceledAt ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Stripe で加入したものは、Stripe の契約も再開する
                      const done = () => {
                        resumeMembership(r.artistId);
                        toast("メンバーシップを再開しました");
                      };
                      if (!r.stripeSessionId || !STRIPE_ENABLED) return done();
                      setBusy(r.artistId);
                      updateMembership(r.stripeSessionId, "resume")
                        .then(done)
                        .catch((e: Error) => toast(e.message))
                        .finally(() => setBusy(null));
                    }}
                    disabled={busy === r.artistId}
                    className="min-h-11 bg-brand px-3 font-bold text-white hover:bg-brand-dark disabled:bg-stone-300"
                  >
                    再開する
                  </button>
                ) : (
                  <>
                    <Link href={`/artists/${r.artist.id}/join?plan=${r.plan.id}`} className="inline-flex min-h-11 items-center justify-center border border-stone-500 px-3 text-center hover:bg-stone-100">
                      プラン変更
                    </Link>
                    <button type="button" disabled={busy === r.artistId} onClick={() => setCanceling(r.artistId)} className="disabled:opacity-50 min-h-11 border border-stone-500 px-3 text-stone-600 hover:border-rose-300 hover:text-rose-700">
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
          const done = () => {
            cancelMembership(target.artistId);
            toast("解約を受け付けました");
          };
          // Stripe で加入したものは、期間の終わりで止まるよう Stripe の契約も解約する
          if (!target.stripeSessionId || !STRIPE_ENABLED) return done();
          const artistId = target.artistId;
          setBusy(artistId);
          updateMembership(target.stripeSessionId, "cancel")
            .then(done)
            .catch((e: Error) => toast(`解約できませんでした：${e.message}`))
            .finally(() => setBusy(null));
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
