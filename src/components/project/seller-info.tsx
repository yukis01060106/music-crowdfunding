import Link from "next/link";
import type { Artist } from "@/types";

/**
 * 実行者（販売者）の特定商取引法に基づく表記。リターン・メンバーシップの販売者は実行者なので、ページごとに出す。
 * TODO: 実行者の本人確認で登録された氏名・住所・電話番号を表示する（個人は請求時に開示でもよい）
 */
export function SellerInfo({ artist, kind }: { artist: Artist; kind: "project" | "membership" }) {
  const rows = [
    { label: "販売者", value: `${artist.name}（本人確認：${artist.verified ? "済み" : "未完了"}）` },
    { label: "所在地・電話番号", value: "請求があった場合、遅滞なく開示します" },
    { label: "連絡先", value: "マイページのメッセージ機能からご連絡ください" },
    {
      label: "お届け・提供時期",
      value: kind === "project" ? "各リターンの「お届け予定」のとおり" : "特典は加入後すぐにご利用いただけます",
    },
    {
      label: "キャンセル",
      value:
        kind === "project"
          ? "リターンの性質上、決済完了後のキャンセルはできません。リターンに不備があった場合は販売者が対応します"
          : "いつでも解約でき、次の更新日以降の請求は発生しません",
    },
  ];
  return (
    <details className="group border border-stone-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-medium">
        特定商取引法に基づく表記（販売者）
        <span className="text-stone-400 transition group-open:rotate-45" aria-hidden>
          ＋
        </span>
      </summary>
      <dl className="divide-y divide-stone-100 border-t border-stone-100 px-4 text-xs">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr]">
            <dt className="font-bold text-stone-600">{r.label}</dt>
            <dd className="text-stone-600">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="px-4 pb-4 text-[11px] text-stone-400">
        プラットフォームの運営者については<Link href="/legal/tokushoho" className="underline">こちら</Link>
      </p>
    </details>
  );
}
