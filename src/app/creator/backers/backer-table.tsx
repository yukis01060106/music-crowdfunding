"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { formatDate, formatYen, jstDateKey } from "@/lib/format";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useDemo } from "@/lib/demo-store";
import { useNewBackings } from "@/lib/backing-state";
import { useNow } from "@/lib/use-now";
import { tagClass } from "@/components/ui/tag";
import { CREATOR_PROJECT_SLUG } from "../creator-context";

export interface BackerRow {
  id: string;
  name: string;
  reward: string;
  amount: number;
  backedAt: string;
  comment?: string;
  /** このブラウザで支援した分 */
  mine?: boolean;
  /** 運営が返金したもの（合計に入れない） */
  refunded?: boolean;
}

// TODO: 支援者の一覧と一斉メッセージは Supabase から取得・送信する。住所は配送画面でのみ扱う
export function BackerTable({ rows: sample, rewards, rewardTitles }: { rows: BackerRow[]; rewards: string[]; rewardTitles: Record<string, string> }) {
  // このブラウザで支援した分を、見本の支援者の上に足す（デモでは支援者の画面とつながっている）
  const { user } = useDemo();
  const now = useNow();
  const mine: BackerRow[] = useNewBackings(CREATOR_PROJECT_SLUG, now).map((b) => ({
    id: b.id,
    name: user?.name ?? "支援者",
    reward: rewardTitles[b.rewardId] ?? "",
    amount: b.refunded ? 0 : b.amount,
    backedAt: b.backedAt,
    comment: b.comment,
    mine: true,
    refunded: b.refunded,
  }));
  const rows = [...mine, ...sample];
  const [reward, setReward] = useState("すべて");
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const shown = rows.filter((r) => reward === "すべて" || r.reward === reward);
  const total = shown.reduce((sum, r) => sum + r.amount, 0);

  function download() {
    const rows = [["支援者", "リターン", "金額", "支援日", "応援コメント"], ...shown.map((r) => [r.name, r.reward, r.amount, formatDate(r.backedAt), r.comment ?? ""])];
    downloadCsv(`backers-${jstDateKey()}.csv`, toCsv(rows));
    toast(`${shown.length}人分のCSVをダウンロードしました`);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-stone-500">リターン</span>
          <select value={reward} onChange={(e) => setReward(e.target.value)} className="border border-stone-500 bg-white px-3 py-1.5">
            <option>すべて</option>
            {rewards.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto flex gap-2">
          <button type="button" onClick={download} className={buttonClass("secondary", "md")}>
            CSVダウンロード
          </button>
          <button type="button" onClick={() => setComposing(true)} className={buttonClass("dark", "md")}>
            {reward === "すべて" ? "全員にメッセージ" : "このリターンの支援者にメッセージ"}
          </button>
        </span>
      </div>
      <p className="mb-2 text-sm text-stone-500">
        {shown.filter((r) => !r.refunded).length}人・合計 {formatYen(total)}{shown.some((r) => r.refunded) && `（ほかに返金済み ${shown.filter((r) => r.refunded).length}件）`}
      </p>
      {/* スマホでは表の右側が見えないので、1人ずつのカードにする */}
      <ul className="divide-y divide-stone-100 border border-stone-200 bg-white text-sm md:hidden">
        {shown.map((b) => (
          <li key={b.id} className="p-4">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{b.name}</span>
              {b.mine && <span className={tagClass("brand")}>新しい支援</span>}
              {b.refunded && <span className={tagClass("danger")}>返金済み</span>}
              <span className="ml-auto font-en font-bold">{formatYen(b.amount)}</span>
            </p>
            <p className="mt-1 text-xs text-stone-600">
              {b.reward}・{formatDate(b.backedAt)}
            </p>
            {b.comment && <p className="mt-1 text-xs text-stone-500">「{b.comment}」</p>}
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto border border-stone-200 bg-white md:block">
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
                  {b.mine && <span className={tagClass("brand", "ml-2")}>新しい支援</span>}
                  {b.refunded && <span className={tagClass("danger", "ml-2")}>返金済み</span>}
                  {b.comment && <span title={b.comment} className="mt-0.5 block max-w-xs line-clamp-2 text-xs text-stone-500">「{b.comment}」</span>}
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
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full border border-stone-500 px-3 py-2" />
          </label>
          <label className="block text-sm">
            本文
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1 w-full border border-stone-500 p-3" />
          </label>
          <p className="text-xs text-stone-500">全員に知らせたい制作の進み具合は、活動報告のほうが向いています。</p>
          <button type="submit" disabled={!subject.trim() || !body.trim()} className={buttonClass("primary", "lg", "w-full")}>
            送信する
          </button>
        </form>
      </Dialog>
    </>
  );
}
