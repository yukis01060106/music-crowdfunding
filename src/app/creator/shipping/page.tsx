import { PageTitle } from "@/components/side-nav";
import { REWARD_KIND_LABELS, type RewardKind } from "@/types";

// リターン種別ごとのお届け方法。デジタルとチケットは自動で届ける
const methods: { kind: RewardKind; how: string }[] = [
  { kind: "digital", how: "配信日にダウンロードリンクを自動でメール送信" },
  { kind: "ticket", how: "公演の2週間前にQRチケットを自動発行" },
  { kind: "physical", how: "お届け先をCSVで出力し、発送後に追跡番号を登録" },
  { kind: "credit", how: "掲載名の確認フォームを支援者に送信" },
  { kind: "experience", how: "日程調整のメッセージを個別に送信" },
];

export default function ShippingPage() {
  return (
    <>
      <PageTitle>リターン配送</PageTitle>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {methods.map((m) => (
          <li key={m.kind} className="flex justify-between gap-4 p-4 text-sm">
            <span className="font-medium">{REWARD_KIND_LABELS[m.kind]}</span>
            <span className="text-right text-stone-600">{m.how}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
