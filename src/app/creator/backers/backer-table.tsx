"use client";

import { useState } from "react";
import { formatDate, formatYen } from "@/lib/format";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export interface BackerRow {
  id: string;
  name: string;
  reward: string;
  amount: number;
  backedAt: string;
  comment?: string;
}

/** Excel で文字化けしないよう BOM を付けた CSV を作る */
function toCsv(rows: BackerRow[]): string {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ["支援者", "リターン", "金額", "支援日", "応援コメント"].map(cell).join(",");
  const lines = rows.map((r) => [r.name, r.reward, r.amount, formatDate(r.backedAt), r.comment ?? ""].map(cell).join(","));
  return "﻿" + [header, ...lines].join("\r\n");
}

// TODO: 支援者の一覧と一斉メッセージは Supabase から取得・送信する。住所は配送画面でのみ扱う
export function BackerTable({ rows, rewards }: { rows: BackerRow[]; rewards: string[] }) {
  const [reward, setReward] = useState("すべて");
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const shown = rows.filter((r) => reward === "すべて" || r.reward === reward);
  const total = shown.reduce((sum, r) => sum + r.amount, 0);

  function download() {
    const blob = new Blob([toCsv(shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${shown.length}人分のCSVをダウンロードしました`);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-stone-500">リターン</span>
          <select value={reward} onChange={(e) => setReward(e.target.value)} className="border border-stone-300 bg-white px-3 py-1.5">
            <option>すべて</option>
            {rewards.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto flex gap-2">
          <button type="button" onClick={download} className="border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-100">
            CSVダウンロード
          </button>
          <button type="button" onClick={() => setComposing(true)} className="bg-ink px-3 py-1.5 font-bold text-white hover:bg-brand">
            {reward === "すべて" ? "全員にメッセージ" : "このリターンの支援者にメッセージ"}
          </button>
        </span>
      </div>
      <p className="mb-2 text-sm text-stone-500">
        {shown.length}人・合計 {formatYen(total)}
      </p>
      <div className="overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="p-3">支援者</th>
              <th className="p-3">リターン</th>
              <th className="p-3 text-right">金額</th>
              <th className="p-3">支援日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {shown.map((b) => (
              <tr key={b.id} className="animate-rise">
                <td className="p-3">
                  <span className="font-medium">{b.name}</span>
                  {b.comment && <span className="mt-0.5 block max-w-xs truncate text-xs text-stone-500">「{b.comment}」</span>}
                </td>
                <td className="p-3">{b.reward}</td>
                <td className="p-3 text-right">{formatYen(b.amount)}</td>
                <td className="p-3 text-stone-500">{formatDate(b.backedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={composing} onClose={() => setComposing(false)} title={`${shown.length}人にメッセージを送る`}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim() || !body.trim()) return;
            setComposing(false);
            setSubject("");
            setBody("");
            toast(`${shown.length}人にメッセージを送りました`);
          }}
        >
          <p className="text-xs text-stone-500">対象：{reward === "すべて" ? "すべての支援者" : `「${reward}」の支援者`}。メールとマイページに届きます。</p>
          <label className="block text-sm">
            件名
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            本文
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1 w-full rounded-lg border border-stone-300 p-3" />
          </label>
          <p className="text-xs text-stone-500">全員に知らせたい制作の進み具合は、活動報告のほうが向いています。</p>
          <button type="submit" disabled={!subject.trim() || !body.trim()} className="w-full bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:bg-stone-300">
            送信する
          </button>
        </form>
      </Dialog>
    </>
  );
}
