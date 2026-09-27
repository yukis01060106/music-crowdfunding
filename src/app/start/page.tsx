import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "プロジェクトをはじめる" };

const steps = [
  { title: "アカウント作成", body: "メールアドレスだけで登録できます。" },
  { title: "ページをつくる", body: "ストーリー、試聴音源、リターンを入力します。目安は1〜3週間。" },
  { title: "審査", body: "提出から最短即日〜5営業日で結果をお知らせします。" },
  { title: "公開・募集開始", body: "審査を通過したら、好きなタイミングで公開ボタンを押すだけ。" },
];

const ideas = ["アルバム・EP制作", "MV制作", "ワンマンライブ・ツアー", "アナログ盤のプレス", "フェス・イベント開催", "機材・スタジオ"];

export default function StartPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-14 px-4 py-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold leading-snug">
          あなたの音楽を、
          <br className="sm:hidden" />
          ファンと一緒に。
        </h1>
        <p className="mt-4 text-stone-600">
          お金だけでなく「参加人数」を目標にしたり、0円プランで応援の声を集めたり。音楽のための機能をそろえています。
        </p>
        <Link href="/creator/projects/new" className="mt-8 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white">
          プロジェクトをつくる
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">こんな企画に</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ideas.map((idea) => (
            <li key={idea} className="rounded-xl border border-stone-200 bg-white p-4 text-center text-sm font-medium">
              {idea}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">公開までの流れ</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4">
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
      </section>
    </div>
  );
}
