import type { FundingModel } from "@/types";

/** 支援者の不安（信頼できるか・届くか・お金はどうなるか）に先回りして答える */
export function TrustBox({ fundingModel, verified }: { fundingModel: FundingModel; verified: boolean }) {
  const items = [
    fundingModel === "all_or_nothing"
      ? { title: "目標に届かなければ支払いなし", body: "All-or-Nothing方式です。目標未達の場合、決済は行われません。" }
      : { title: "目標に届かなくても実施", body: "All-in方式です。達成の有無にかかわらず、プロジェクトは実行されます。" },
    verified
      ? { title: "本人確認済みの実行者", body: "運営が本人確認書類を確認しています。" }
      : { title: "本人確認は審査中", body: "運営による本人確認が完了するまでお待ちください。" },
    { title: "表示価格は税込・送料込み", body: "リターンの金額以外に、追加の費用はかかりません。" },
    { title: "カード情報は保存しません", body: "決済は国際セキュリティ基準（PCI DSS）に準拠した決済会社が行います。" },
    { title: "届かないときはサポートへ", body: "実行者と連絡が取れない場合は、運営が間に入って対応します。" },
  ];

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
      <h2 className="font-bold text-emerald-900">安心して支援するために</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.title} className="flex gap-2 text-sm">
            <span aria-hidden className="text-emerald-600">
              ✓
            </span>
            <span>
              <span className="font-medium text-stone-800">{item.title}</span>
              <span className="block text-xs text-stone-600">{item.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
