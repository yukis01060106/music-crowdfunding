import type { Metadata } from "next";

export const metadata: Metadata = { title: "ヘルプ" };

const faqs = [
  { q: "支援金はいつ決済されますか？", a: "All-or-Nothing方式は目標達成時に募集終了後に決済されます。All-in方式は支援した時点で決済されます。" },
  { q: "0円プランとは？", a: "お金をかけずに参加表明できるプランです。参加人数を目標にしたプロジェクトでは1人としてカウントされます。" },
  { q: "高校生でもプロジェクトを立ち上げられますか？", a: "18歳未満の方は、保護者の同意書を提出いただければ立ち上げられます。" },
  { q: "リターンが届きません", a: "マイページの「メッセージ」から実行者に問い合わせてください。" },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">ヘルプ</h1>
      <dl className="mt-8 space-y-4">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-xl border border-stone-200 bg-white p-5">
            <dt className="font-bold">Q. {f.q}</dt>
            <dd className="mt-2 text-sm text-stone-600">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
