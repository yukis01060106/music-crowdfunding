import type { Metadata } from "next";
import Link from "next/link";
import { tagClass } from "@/components/ui/tag";
import { FeeSimulator } from "./fee-simulator";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";
import { buttonClass } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { REWARD_IDEAS } from "@/lib/reward-ideas";
import { formatYen } from "@/lib/format";
import { REWARD_KIND_LABELS } from "@/types";

export const metadata: Metadata = { title: "プロジェクトをはじめる", description: "アルバム・ライブ・MVを、ファンの支援で。掲載は無料。AI校正やプレビューで、はじめてでも安心してプロジェクトをつくれます。", alternates: { canonical: "/start/" } };

const FEATURES = [
  { title: "試聴プレイヤー", body: "ページの一番上で、あなたの音楽をすぐ聴いてもらえます。" },
  { title: "0円プラン・参加人数目標", body: "お金をかけずに「応援したい」「ライブに行く」を集められます。" },
  { title: "音楽のためのリターン", body: "先行配信は自動でお届け、ライブチケットはQRで自動発行。" },
  { title: "月額メンバーシップ", body: "プロジェクトの合間も、毎月の応援を。メンバーは次のプロジェクトの最初の支援者になってくれます。" },
  { title: "AI校正", body: "誤字脱字や、審査で差し戻されやすい表現をその場でチェック。修正案はワンクリックで反映できます。" },
  { title: "プレビューと下書き保存", body: "支援者にどう見えるかをPCとスマホで確認。入力は自動で下書き保存されます。" },
  { title: "ONE NOTE FES", body: "Oto Fundで挑戦したアーティストが集まる音楽フェスを企画中。手数料の一部が開催費用になります。" },
  { title: "高校生・大学生も", body: "18歳未満の方も、保護者の同意があれば挑戦できます。" },
];

const IDEAS = ["アルバム・EP制作", "MV制作", "ワンマンライブ・ツアー", "アナログ盤のプレス", "フェス・イベント開催", "機材・スタジオ"];

const REWARD_TIPS = [
  { price: "0円", body: "応援・参加表明。支援者の母数を増やし、シェアのきっかけに。" },
  { price: "¥1,500〜¥3,000", body: "主力のリターン。音源の先行配信やCDなど、選ばれやすい価格帯の目安です。" },
  { price: "¥5,000〜¥10,000", body: "ライブ招待、サイン、クレジット掲載など「ここでしか手に入らない」もの。" },
  { price: "¥30,000〜", body: "レコーディング見学など、少数限定の体験。" },
];

const STEPS = [
  { title: "アカウント作成", body: "メールアドレスだけで登録できます。" },
  { title: "ページをつくる", body: "ストーリー、試聴音源、リターンを入力します。目安は1〜3週間。" },
  { title: "審査", body: "審査の結果は、5営業日ほどを目安にお知らせします。" },
  { title: "公開・募集開始", body: "審査を通過したら、好きなタイミングで公開ボタンを押すだけ。" },
];

export default function StartPage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="font-en text-xs font-medium tracking-wide text-stone-500">For artists</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.4] tracking-[0.12em] sm:text-5xl">
            {["あなたの音楽を、", "ファンと一緒に。"].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <span className="block animate-line-in" style={{ animationDelay: `${150 + i * 150}ms` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-md leading-loose tracking-wider text-stone-700">
            高校生バンドから歌い手、インディーズ、メジャーまで。音楽のために作ったクラウドファンディングです。掲載は無料。
          </p>
          <Link href="/creator/projects/new" className={buttonClass("primary", "lg", "mt-8")}>
            無料でプロジェクトをつくる <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3">
          <div className="relative mt-12 aspect-[2/3] overflow-hidden">
            <Photo src="/images/keyboard-room.jpg" alt="" sizes="(min-width: 1024px) 220px, 45vw" priority />
          </div>
          <div className="relative aspect-[2/3] overflow-hidden">
            <Photo src="/images/guitar-smile.jpg" alt="" sizes="(min-width: 1024px) 220px, 45vw" priority />
          </div>
          <Sticker shape="circle" color="yellow" size={60} className="-right-4 -top-5" float />
          <Sticker shape="square" color="teal" size={40} rotate={18} className="-left-4 bottom-10" float />
          <Sticker shape="triangle" color="purple" size={44} className="left-[45%] top-1/2" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20">
        <section>
          <SectionHeading en="Features" ja="音楽のための機能" />
          <div className="mt-8">
            <ul data-stagger className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.title} className="border-t-[3px] border-brand bg-stone-50 p-5">
                  <p className="font-bold">{f.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <SectionHeading en="Fees" ja="手数料と受け取れる金額" lead="金額を動かして、手元に残る額を確かめてください。" />
          <div className="mt-8">
            <FeeSimulator />
            <div className="mt-6">
              <Link href="/creator/projects/new" className={buttonClass("primary", "lg")}>
                無料でプロジェクトをつくる
              </Link>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading en="Rewards" ja="リターン設計のコツ" lead="1回の支援は数千円が中心になりやすいので、リターンは3〜5種類にしぼり、価格帯をばらけさせましょう。" />
          <div className="mt-8">
            <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
              {REWARD_TIPS.map((t) => (
                <li key={t.price} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
                  <span className="w-36 shrink-0 font-bold text-brand">{t.price}</span>
                  <span className="text-sm text-stone-600">{t.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <SectionHeading en="Examples" ja="リターンの事例" lead="音楽ならではのリターンの例です。金額は目安なので、活動の規模に合わせて決めてください。プロジェクトの作成画面から、そのまま下書きに入れられます。" />
          <div className="mt-8">
            <ul data-stagger className="grid gap-3 sm:grid-cols-2">
              {REWARD_IDEAS.map((idea) => (
                <li key={idea.id} className="flex flex-col gap-2 border-[3px] border-stone-200 bg-white p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{idea.title}</h3>
                    <span className="shrink-0 text-sm text-stone-500">
                      目安 <span className="font-en font-bold text-brand">{formatYen(idea.price)}</span>
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-600">{idea.pitch}</p>
                  <p className="mt-auto flex flex-wrap gap-1.5">
                    <span className={tagClass()}>{REWARD_KIND_LABELS[idea.kind]}</span>
                    {idea.limit !== undefined && <span className={tagClass("brand")}>{idea.limit === 1 ? "1点もの" : `${idea.limit}${idea.unit ?? ""}限定がおすすめ`}</span>}
                    {!idea.requiresShipping && <span className={tagClass()}>配送なし</span>}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href="/creator/projects/new" className={buttonClass("primary", "lg")}>
                事例を使ってつくってみる <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading en="Ideas" ja="こんな企画に" />
          <div className="mt-8">
            <ul data-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {IDEAS.map((idea) => (
                <li key={idea} className="bg-brand-soft p-4 text-center text-sm font-bold tracking-wider text-brand-dark">
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <SectionHeading en="Flow" ja="公開までの流れ" />
          <div className="mt-8">
            <ol data-stagger className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-5 bg-stone-50 p-5">
                  <span className="w-12 shrink-0 font-en text-4xl font-black leading-none text-brand/30" aria-hidden>
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-bold">{s.title}</p>
                    <p className="text-sm text-stone-600">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-center text-sm text-stone-600">
              手数料や審査について詳しくは <Link href="/help#artist" className="text-brand underline">よくある質問</Link> へ。
            </p>
            <div className="mt-6 text-center">
              <Link href="/creator/projects/new" className={buttonClass("primary", "lg")}>
                無料でプロジェクトをつくる
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
