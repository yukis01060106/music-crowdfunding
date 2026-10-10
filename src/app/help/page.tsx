import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_GROUPS } from "./faq";
import { FaqSearch } from "./faq-search";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "はじめての方へ・よくある質問", description: "支援のしかた、決済のタイミング、リターン、メンバーシップ、ONE NOTE FES についてのよくある質問。", alternates: { canonical: "/help/" } };

const STEPS = [
  { en: "Find", title: "応援したい音楽を見つける", body: "試聴して、アーティストの想いを読んで、気に入ったら。" },
  { en: "Support", title: "リターンを選んで支援", body: "会員登録なしでOK。0円で参加できるプランもあります。" },
  { en: "Receive", title: "音楽とリターンが届く", body: "制作の様子は活動報告で。完成したら、あなたの手元へ。" },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-en text-xs tracking-wide text-stone-500">Guide</p>
      <h1 className="mt-1 text-2xl font-black tracking-[0.12em] sm:text-3xl">はじめての方へ・よくある質問</h1>
      <p className="mt-3 leading-relaxed text-stone-600">OTOFUNDは、アーティストの「これから」を支援して、完成した音楽やライブの体験を受け取るサービスです。</p>

      <ol data-stagger className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="border-t-[3px] border-pop-teal bg-white p-4">
            <p className="font-en text-3xl font-black text-pop-teal/30">0{i + 1}</p>
            <p className="font-en text-xs font-bold text-teal-700">{s.en}</p>
            <p className="mt-1 font-bold">{s.title}</p>
            <p className="mt-1 text-sm text-stone-600">{s.body}</p>
          </li>
        ))}
      </ol>

      <FaqSearch groups={FAQ_GROUPS} />

      <div className="mt-12 bg-stone-100 p-6 text-center text-sm">
        <p>解決しない場合は、お気軽にお問い合わせください。</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Link href="/projects" className={buttonClass("primary", "md")}>
            プロジェクトをさがす
          </Link>
          <Link href="/contact" className={buttonClass("dark", "md")}>
            お問い合わせ
          </Link>
        </div>
      </div>
    </div>
  );
}
