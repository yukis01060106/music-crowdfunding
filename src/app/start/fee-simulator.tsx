"use client";

import { useState } from "react";
import { PLATFORM_FEE_RATE, payoutAmount } from "@/lib/fees";
import { formatYen } from "@/lib/format";

/** 「結局いくら手元に残るのか」をその場で確かめられるように */
export function FeeSimulator() {
  const [raised, setRaised] = useState(500_000);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <label className="block text-sm font-bold" htmlFor="raised">
        集まった金額
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          id="raised"
          type="range"
          min={50_000}
          max={5_000_000}
          step={50_000}
          value={raised}
          onChange={(e) => setRaised(Number(e.target.value))}
          className="flex-1 accent-brand"
        />
        <span className="w-32 text-right text-lg font-bold">{formatYen(raised)}</span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg bg-stone-50 p-4">
          <dt className="text-stone-500">手数料（{PLATFORM_FEE_RATE * 100}%・決済手数料込み）</dt>
          <dd className="mt-1 text-lg font-bold">−{formatYen(raised - payoutAmount(raised))}</dd>
        </div>
        <div className="rounded-lg bg-brand-soft p-4">
          <dt className="text-brand">受け取れる金額</dt>
          <dd className="mt-1 text-2xl font-bold text-brand">{formatYen(payoutAmount(raised))}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-stone-500">
        掲載は無料。目標に届かなかったAll-or-Nothingのプロジェクトは、手数料もかかりません。
      </p>
    </div>
  );
}
