import type { Metadata } from "next";
import Link from "next/link";
import { FeeSimulator } from "./fee-simulator";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";

export const metadata: Metadata = { title: "プロジェクトをはじめる" };

const FEATURES = [
  { title: "試聴プレイヤー", body: "ページの一番上で、あなたの音楽をすぐ聴いてもらえます。" },
  { title: "0円プラン・参加人数目標", body: "お金をかけずに「応援したい」「ライブに行く」を集められます。" },
  { title: "音楽のためのリターン", body: "先行配信は自動でお届け、ライブチケットはQRで自動発行。" },
  { title: "高校生・大学生も", body: "18歳未満の方も、保護者の同意があれば挑戦できます。" },
];

const IDEAS = ["アルバム・EP制作", "MV制作", "ワンマンライブ・ツアー", "アナログ盤のプレス", "フェス・イベント開催", "機材・スタジオ"];

const REWARD_TIPS = [
  { price: "0円", body: "応援・参加表明。支援者の母数を増やし、シェアのきっかけに。" },
  { price: "1,500〜3,000円", body: "主力のリターン。音源の先行配信やCDなど、いちばん選ばれる価格帯です。" },
  { price: "5,000〜10,000円", body: "ライブ招待、サイン、クレジット掲載など「ここでしか手に入らない」もの。" },
  { price: "30,000円〜", body: "レコーディング見学など、少数限定の体験。" },
];

const STEPS = [
  { title: "アカウント作成", body: "メールアドレスだけで登録できます。" },
  { title: "ページをつくる", body: "ストーリー、試聴音源、リターンを入力します。目安は1〜3週間。" },
  { title: "審査", body: "提出から最短即日〜5営業日で結果をお知らせします。" },
  { title: "公開・募集開始", body: "審査を通過したら、好きなタイミングで公開ボタンを押すだけ。" },
];

export default function StartPage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="font-en text-xs font-medium tracking-wide text-stone-500">For artists</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.4] tracking-[0.12em] sm:text-5xl">
            あなたの音楽を、
            <br />
            ファンと一緒に。
          </h1>
          <p className="mt-6 max-w-md leading-loose tracking-wider text-stone-700">
            メジャーアーティストから高校生バンドまで。音楽のために作ったクラウドファンディングです。掲載は無料。
          </p>
          <Link href="/creator/projects/new" className="mt-8 inline-block bg-ink px-8 py-4 font-bold tracking-wider text-white hover:bg-brand">
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

      <div className="mx-auto max-w-4xl space-y-16 px-4 py-14">
        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-[0.1em]">音楽のための機能</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="border border-stone-200 bg-white p-5">
                <p className="font-bold">{f.title}</p>
                <p className="mt-1 text-sm text-stone-600">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-bold tracking-[0.1em]">手数料と受け取れる金額</h2>
          <p className="mb-6 text-sm text-stone-500">金額を動かして、手元に残る額を確かめてください。</p>
          <FeeSimulator />
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-bold tracking-[0.1em]">リターン設計のコツ</h2>
          <p className="mb-6 text-sm text-stone-500">
            支援者の約半数は、1回の予算が1万円未満です。リターンは3〜5種類にしぼり、価格帯をばらけさせましょう。
          </p>
          <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
            {REWARD_TIPS.map((t) => (
              <li key={t.price} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
                <span className="w-36 shrink-0 font-bold text-brand">{t.price}</span>
                <span className="text-sm text-stone-600">{t.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-[0.1em]">こんな企画に</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {IDEAS.map((idea) => (
              <li key={idea} className="border border-stone-200 bg-white p-4 text-center text-sm font-medium">
                {idea}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-[0.1em]">公開までの流れ</h2>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 border border-stone-200 bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="text-sm text-stone-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link href="/creator/projects/new" className="inline-block bg-ink px-8 py-4 font-bold tracking-wider text-white hover:bg-brand">
              無料でプロジェクトをつくる
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
