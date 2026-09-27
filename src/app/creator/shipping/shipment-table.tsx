"use client";

import { useState } from "react";

type Status = "未発送" | "発送済み";

interface Shipment {
  id: string;
  name: string;
  reward: string;
  prefecture: string;
  status: Status;
  tracking: string;
}

// モック。住所の全文は CSV 出力時だけ扱い、画面には都道府県までしか出さない
const SHIPMENTS: Shipment[] = [
  { id: "s1", name: "ゆう", reward: "サイン入りCD＋先行配信", prefecture: "東京都", status: "未発送", tracking: "" },
  { id: "s2", name: "mika", reward: "サイン入りCD＋先行配信", prefecture: "大阪府", status: "未発送", tracking: "" },
  { id: "s3", name: "kenta", reward: "アナログ盤（12インチ）", prefecture: "北海道", status: "発送済み", tracking: "1234-5678-9012" },
];

export function ShipmentTable() {
  const [rows, setRows] = useState(SHIPMENTS);
  const [filter, setFilter] = useState<Status | "すべて">("すべて");
  const shown = rows.filter((r) => filter === "すべて" || r.status === filter);
  const pending = rows.filter((r) => r.status === "未発送").length;

  const setRow = (id: string, patch: Partial<Shipment>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 text-sm">
          {(["すべて", "未発送", "発送済み"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={`px-3 py-1.5 transition ${filter === f ? "bg-ink text-white" : "border border-stone-300 bg-white hover:bg-stone-100"}`}>
              {f}
              {f === "未発送" && pending > 0 && <span className="ml-1 rounded-full bg-brand px-1.5 text-[10px] text-white">{pending}</span>}
            </button>
          ))}
        </div>
        {/* TODO: サーバーでお届け先を含む CSV を作り、ダウンロード履歴を残す */}
        <button type="button" className="border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">
          お届け先をCSVで出力
        </button>
      </div>
      <div className="overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="p-3">支援者</th>
              <th className="p-3">リターン</th>
              <th className="p-3">お届け先</th>
              <th className="p-3">追跡番号</th>
              <th className="p-3">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {shown.map((r) => (
              <tr key={r.id} className="animate-rise">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.reward}</td>
                <td className="p-3 text-stone-500">{r.prefecture}</td>
                <td className="p-3">
                  <input value={r.tracking} onChange={(e) => setRow(r.id, { tracking: e.target.value })} placeholder="未入力" aria-label={`${r.name}さんの追跡番号`} className="w-36 rounded border border-stone-300 px-2 py-1 text-xs" />
                </td>
                <td className="p-3">
                  {r.status === "発送済み" ? (
                    <span className="text-xs font-bold text-emerald-600">✓ 発送済み</span>
                  ) : (
                    <button type="button" onClick={() => setRow(r.id, { status: "発送済み" })} className="bg-brand px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-dark">
                      発送済みにする
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">発送済みにすると、支援者に追跡番号つきのお知らせメールが届きます。</p>
    </div>
  );
}
