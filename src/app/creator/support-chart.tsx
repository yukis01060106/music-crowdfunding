"use client";

import { useState } from "react";
import { formatYen } from "@/lib/format";

export interface DailyPoint {
  /** YYYY-MM-DD */
  date: string;
  amount: number;
}

const HEIGHT = 180;
const PAD = { top: 20, right: 8, bottom: 26, left: 56 };
const BAR_MAX = 24;
const RADIUS = 4;

/** 見やすい目盛り（1・2・5 の倍数）で上限を切り上げる */
function niceMax(v: number): { max: number; step: number } {
  const raw = Math.max(1, v) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return { max: step * Math.ceil(v / step), step };
}

/** 上端だけ角を丸めた棒。根元は四角のまま */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(RADIUS, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

/** 日ごとの支援額。1系列なので凡例は置かず、見出しで何のグラフかを示す */
export function SupportChart({ data, title, width = 640 }: { data: DailyPoint[]; title: string; width?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const { max, step } = niceMax(Math.max(...data.map((d) => d.amount)));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.min(BAR_MAX, band - 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const peak = data.reduce((best, d, i) => (d.amount > data[best].amount ? i : best), 0);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <figure className="border border-stone-200 bg-white p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs text-stone-500">合計 {formatYen(total)}</span>
      </figcaption>
      <div className="relative mt-2">
        <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={`日ごとの支援額。最大は${md(data[peak].date)}の${formatYen(data[peak].amount)}`} onMouseLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-stone-500 text-[10px]">
                {t >= 10_000 ? `${t / 10_000}万` : t.toLocaleString("ja-JP")}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const h = Math.max(0, y(0) - y(d.amount));
            return (
              <g key={d.date}>
                <path d={barPath(cx - barW / 2, y(d.amount), barW, h)} fill="#6d3cff" opacity={active === null || active === i ? 1 : 0.35} className="transition-opacity" />
                {/* 当たり判定は棒より広く、帯全体にする */}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0} aria-label={`${md(d.date)} ${formatYen(d.amount)}`} className="focus:outline-none" />
                {(i === 0 || i === data.length - 1 || i % 3 === 0) && (
                  <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="fill-stone-500 text-[10px]">
                    {md(d.date)}
                  </text>
                )}
                {i === peak && active === null && (
                  <text x={cx} y={y(d.amount) - 6} textAnchor="middle" className="fill-ink text-[10px] font-bold">
                    {formatYen(d.amount)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="#a8a29e" strokeWidth={1} />
        </svg>
        {active !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: `${((PAD.left + band * active + band / 2) / width) * 100}%`, top: `${(y(data[active].amount) / HEIGHT) * 100}%`, marginTop: -8 }}
          >
            <span className="block text-white/70">{md(data[active].date)}</span>
            <span className="font-bold">{formatYen(data[active].amount)}</span>
          </div>
        )}
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-stone-500">表で見る</summary>
        <table className="mt-2 w-full">
          <tbody className="divide-y divide-stone-100">
            {data.map((d) => (
              <tr key={d.date}>
                <td className="py-1">{md(d.date)}</td>
                <td className="py-1 text-right">{formatYen(d.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
