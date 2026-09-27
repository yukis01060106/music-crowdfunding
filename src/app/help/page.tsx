import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_FEE_RATE } from "@/lib/fees";

export const metadata: Metadata = { title: "はじめての方へ・よくある質問" };

const FAQ_GROUPS = [
  {
    title: "支援について",
    items: [
      { q: "会員登録は必要ですか？", a: "不要です。メールアドレスだけで支援できます。パスワードを設定すると、マイページで支援内容を確認できます。" },
      { q: "0円プランとは？", a: "お金をかけずに参加表明できるプランです。参加人数を目標にしたプロジェクトでは1人としてカウントされます。" },
      { q: "支援をキャンセルできますか？", a: "決済完了後のキャンセルはできません。All-or-Nothingのプロジェクトは、目標未達なら決済自体が行われません。" },
    ],
  },
  {
    title: "お金について",
    items: [
      { q: "支援金はいつ決済されますか？", a: "All-or-Nothing方式は、目標を達成した場合のみ募集終了後に決済されます。All-in方式は支援した時点で決済されます。" },
      { q: "送料はかかりますか？", a: "かかりません。表示価格はすべて税込・送料込みです。" },
      { q: "使える支払い方法は？", a: "クレジットカード、Apple Pay / Google Pay、PayPay、コンビニ払いです。" },
      { q: "カード情報は安全ですか？", a: "決済は国際セキュリティ基準（PCI DSS）に準拠した決済会社が行い、カード情報は当サイトに保存されません。" },
    ],
  },
  {
    title: "リターンについて",
    items: [
      { q: "リターンはいつ届きますか？", a: "各リターンに「お届け予定」を表示しています。遅れる場合は、実行者が活動報告とメールでお知らせします。" },
      { q: "リターンが届きません", a: "マイページの「メッセージ」から実行者に問い合わせてください。実行者と連絡が取れない場合は、運営が間に入って対応します。" },
      { q: "デジタル音源はどうやって受け取りますか？", a: "配信日にダウンロードリンクをメールでお送りします。マイページからもダウンロードできます。" },
    ],
  },
  {
    title: "アーティストの方へ",
    items: [
      { q: "手数料はいくらですか？", a: `集まった金額の${PLATFORM_FEE_RATE * 100}%（決済手数料込み）です。掲載は無料です。` },
      { q: "高校生でもプロジェクトを立ち上げられますか？", a: "18歳未満の方は、保護者の同意書を提出いただければ立ち上げられます。" },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">はじめての方へ・よくある質問</h1>
      <p className="mt-2 text-stone-600">OTOFUNDは、アーティストの「これから」を支援して、完成した音楽やライブの体験を受け取るサービスです。</p>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="質問のカテゴリ">
        {FAQ_GROUPS.map((g) => (
          <a key={g.title} href={`#${g.title}`} className="rounded-full border border-stone-300 bg-white px-3 py-1 hover:border-brand hover:text-brand">
            {g.title}
          </a>
        ))}
      </nav>

      {FAQ_GROUPS.map((g) => (
        <section key={g.title} id={g.title} className="mt-10 scroll-mt-20">
          <h2 className="mb-3 text-lg font-bold">{g.title}</h2>
          <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
            {g.items.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="flex cursor-pointer list-none justify-between gap-4 font-medium">
                  Q. {f.q}
                  <span className="text-stone-400 transition group-open:rotate-45" aria-hidden>
                    ＋
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">A. {f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-12 bg-stone-100 p-6 text-center text-sm">
        <p>解決しない場合は、お問い合わせください。</p>
        <Link href="/mypage/messages" className="mt-3 inline-block rounded-full bg-brand px-5 py-2 font-medium text-white">
          お問い合わせ
        </Link>
      </div>
    </div>
  );
}
