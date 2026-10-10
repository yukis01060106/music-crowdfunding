"use client";

import { useRef, useState } from "react";
import { formatYen } from "@/lib/format";
import { tagClass } from "@/components/ui/tag";
import { setFesRate, useAdmin } from "@/lib/admin-store";
import { DemoNote, Kpi, SectionTitle, TableBox, TD, TH } from "../admin-ui";

// TODO: 手数料収入は Stripe の記録から月ごとに集計する。割合が決まったら設定として保存する
export function FesFund({ months }: { months: { month: string; fee: number }[] }) {
  // 割合は未定。決まった数字と誤解されないよう、0% から試してもらう（試した値はこのブラウザに保存）
  const { fesRate: rate, log } = useAdmin();
  // いちばん新しい「FES の割合を試算」の記録の値（なければ 0）
  const lastRecorded = Number(log.find((e) => e.action === "fes_rate")?.target.replace("%", "") ?? 0);
  // 数値の欄は、打ち直しやすいよう入力中は空のままにできる（計算には rate を使う）
  const [draft, setDraft] = useState<string | null>(null);
  const total = months.reduce((s, m) => s + m.fee, 0);
  const fund = (fee: number) => Math.floor((fee * rate) / 100);
  const max = Math.max(...months.map((m) => m.fee));
  // 最後の月は途中までなので、平均には締まった月だけを使う
  const closed = months.slice(0, -1);
  const closedTotal = closed.reduce((s, m) => s + m.fee, 0);
  const clamp = (v: number) => Math.min(50, Math.max(0, Number.isFinite(v) ? Math.round(v) : 0));
  // 動かしている間は保存だけ。確定したとき（つまみを離す・欄やつまみから出る）に、前回の記録から変わっていれば記録に残す
  const committed = useRef<number | null>(null);
  const commit = () => {
    const last = committed.current ?? lastRecorded;
    if (rate === last) return;
    committed.current = rate;
    setFesRate(rate, true);
  };

  return (
    <>
      <div className="border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-bold" htmlFor="fes-rate">
            手数料収入のうち、FES にあてる割合
          </label>
          <span className={tagClass("warning")}>試算・未決定</span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <input id="fes-rate" type="range" min={0} max={50} step={1} value={rate} aria-valuetext={`${rate}%`} onChange={(e) => setFesRate(clamp(Number(e.target.value)))} onPointerUp={commit} onBlur={commit} className="h-11 flex-1 accent-brand" />
          <label className="flex items-center gap-1 text-sm">
            <span className="sr-only">割合（%）</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              value={draft ?? String(rate)}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value !== "") setFesRate(clamp(Number(e.target.value)));
              }}
              onBlur={() => {
                setDraft(null);
                commit();
              }}
              className="min-h-11 w-20 border border-stone-500 bg-white px-3 py-2 text-right text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
            %
          </label>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label={`手数料収入（税別・${months.length}か月）`} value={formatYen(total)} />
        <Kpi label="FES への積み立て（試算）" value={formatYen(fund(total))} />
        <Kpi label="1か月あたり（平均）" value={formatYen(Math.floor(fund(closedTotal) / Math.max(1, closed.length)))} note="締まった月の平均（今月は途中まで）" />
      </div>

      <SectionTitle>月ごとの内訳</SectionTitle>
      <TableBox label="月ごとの手数料収入と FES への積み立て" minWidth={520}>
        <thead className="bg-stone-50">
          <tr>
            <th className={TH}>月</th>
            <th className={`${TH} text-right`}>手数料収入（税別）</th>
            <th className={`${TH} text-right`}>FES への積み立て</th>
            <th className={TH}>
              <span className="sr-only">グラフ</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {months.map((m) => (
            <tr key={m.month}>
              <td className={TD}>{`${m.month.slice(0, 4)}年${Number(m.month.slice(5))}月`}</td>
              <td className={`${TD} text-right`}>{formatYen(m.fee)}</td>
              <td className={`${TD} text-right font-bold`}>{formatYen(fund(m.fee))}</td>
              <td className={`${TD} w-1/3`}>
                <div className="h-2 bg-stone-100" aria-hidden>
                  <div className="h-full bg-brand/70" style={{ width: `${(m.fee / max) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableBox>

      <DemoNote>デモのため、手数料収入は見本の数字です。割合を決めたら、事業計画とあわせて利用規約（第8条）とサイトの表記を見直します。</DemoNote>
    </>
  );
}
