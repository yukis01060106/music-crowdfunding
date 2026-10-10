"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDate, jstDateKey } from "@/lib/format";
import { own, setShipped, useDemo } from "@/lib/demo-store";
import { useNewBackings } from "@/lib/backing-state";
import { useNow } from "@/lib/use-now";
import { tagClass } from "@/components/ui/tag";
import { buttonClass } from "@/components/ui/button";
import { chipClass } from "@/components/ui/chip";
import { CREATOR_PROJECT_SLUG, prefectureOf } from "../creator-context";

type Status = "未発送" | "発送済み";

interface Shipment {
  id: string;
  name: string;
  reward: string;
  prefecture: string;
  /** 住所の全文。CSV にだけ出す */
  address: string;
  /** このブラウザで支援した分（支援者のマイページにも発送の状況が出る） */
  mine?: boolean;
  /** 支援者のアカウント名（お届け先の名前と違うことがある） */
  account?: string;
  /** 運営が返金したもの（発送しない） */
  refunded?: boolean;
  backedAt?: string;
}

// モック。住所の全文は CSV 出力時だけ扱い、画面には都道府県までしか出さない
// TODO（本番前に必須）: 住所の全文はクライアントに渡さない。一覧は都道府県まで、CSV はサーバーで認証つきで作る
export const SHIPMENTS: Shipment[] = [
  { id: "sample:s1", name: "ゆう", reward: "サイン入りCD＋先行配信", prefecture: "東京都", address: "〒150-0001 東京都渋谷区神宮前1-2-3" },
  { id: "sample:s2", name: "mika", reward: "サイン入りCD＋先行配信", prefecture: "大阪府", address: "〒530-0001 大阪府大阪市北区梅田4-5-6" },
  { id: "sample:s3", name: "kenta", reward: "サイン入りCD＋先行配信", prefecture: "北海道", address: "〒060-0001 北海道札幌市中央区北1条西7-8" },
];

/** 配送が必要なリターンの一覧。見本の支援者に、このブラウザで支援した分を足す。発送済みは支援者のマイページにも出る */
export function ShipmentTable({ rewards }: { rewards: { id: string; title: string; requiresShipping: boolean }[] }) {
  const { user, shipped, tracking: savedTracking } = useDemo();
  const now = useNow();
  // 入力中の追跡番号（発送済みにしたとき保存する）
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Status | "すべて">("すべて");
  const mine: Shipment[] = useNewBackings(CREATOR_PROJECT_SLUG, now)
    // お届け先が取れなかった支援（決済の画面を別のタブで開いたときなど）も、「お届け先未入力」として出す
    .filter((b) => rewards.find((r) => r.id === b.rewardId)?.requiresShipping)
    .map((b) => ({
      id: b.id,
      name: b.shipping?.name || user?.name || "支援者",
      reward: rewards.find((r) => r.id === b.rewardId)?.title ?? "",
      prefecture: b.shipping ? prefectureOf(b.shipping.address) : "お届け先未入力",
      address: b.shipping ? `〒${b.shipping.postalCode} ${b.shipping.address}` : "",
      mine: true,
      account: user?.name,
      refunded: b.refunded,
      backedAt: b.backedAt,
    }));
  const rows = [...mine, ...SHIPMENTS];
  const statusOf = (r: Shipment): Status => (own(shipped, r.id) ? "発送済み" : "未発送");
  const shown = rows.filter((r) => filter === "すべて" || statusOf(r) === filter);
  const pending = rows.filter((r) => statusOf(r) === "未発送" && !r.refunded).length;

  function exportCsv() {
    const target = rows.filter((r) => statusOf(r) === "未発送" && !r.refunded && r.address);
    downloadCsv(`shipping-${jstDateKey()}.csv`, toCsv([["お名前", "住所", "リターン"], ...target.map((r) => [r.name, r.address, r.reward])]));
    toast(`未発送の${target.length}件をCSVで出力しました`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 text-sm">
          {(["すべて", "未発送", "発送済み"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={chipClass(filter === f)}>
              {f}
              {f === "未発送" && pending > 0 && <span className="ml-1">（{pending}）</span>}
            </button>
          ))}
        </div>
        {/* TODO: サーバーでお届け先を含む CSV を作り、ダウンロード履歴を残す */}
        <button type="button" onClick={exportCsv} disabled={pending === 0} className={buttonClass("secondary", "md")}>
          未発送のお届け先をCSVで出力
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
                <td className="p-3 font-medium">
                  {r.name}
                  {r.mine && <span className={tagClass("brand", "ml-2")}>新しい支援</span>}
                  {r.refunded && <span className={tagClass("danger", "ml-2")}>返金済み</span>}
                  {r.account && r.account !== r.name && <span className="block text-xs font-normal text-stone-500">アカウント：{r.account}</span>}
                  {r.backedAt && <span className="block text-xs font-normal text-stone-500">{formatDate(r.backedAt)} 支援</span>}
                </td>
                <td className="p-3">{r.reward}</td>
                <td className="p-3 text-stone-500">{r.prefecture}</td>
                <td className="p-3">
                  <input value={tracking[r.id] ?? own(savedTracking, r.id) ?? ""} onChange={(e) => setTracking((t) => ({ ...t, [r.id]: e.target.value }))} placeholder="未入力" aria-label={`${r.name}さんの追跡番号`} className="min-h-11 w-36 border border-stone-500 px-2 py-1 text-xs" />
                </td>
                <td className="p-3">
                  {r.refunded && statusOf(r) === "未発送" ? (
                    <span className="text-xs text-stone-600">返金済みのため発送しません</span>
                  ) : statusOf(r) === "発送済み" ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={tagClass(r.refunded ? "danger" : "success")}>{r.refunded ? "返金済み・発送済み（要確認）" : "✓ 発送済み"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShipped(r.id, false);
                          toast("未発送に戻しました");
                        }}
                        aria-label={`${r.name}さんの発送を取り消す`}
                        className="min-h-11 px-1 text-xs text-stone-500 underline"
                      >
                        取り消す
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const no = (tracking[r.id] ?? "").trim();
                        setShipped(r.id, true, no);
                        toast(no ? `${r.name}さんに、追跡番号つきで発送のお知らせを送りました` : `${r.name}さんに発送のお知らせを送りました（追跡番号なし）`);
                      }}
                      aria-label={`${r.name}さんのリターンを発送済みにする`}
                      className={buttonClass("primary", "md")}
                    >
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
