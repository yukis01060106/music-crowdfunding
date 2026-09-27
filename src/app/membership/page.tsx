import type { Metadata } from "next";
import { getArtists } from "@/lib/data";
import { FES_FUND_MESSAGE, PLATFORM_FEE_RATE } from "@/lib/fees";
import { withMembership } from "@/lib/membership";
import { CommonPerks } from "@/components/membership/common-perks";
import { MembershipArtistCard } from "@/components/membership/membership-artist-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Sticker } from "@/components/ui/shapes";

export const metadata: Metadata = { title: "メンバーシップ" };

const POINTS = [
  { en: "Linked", title: "クラファンとつながる", body: "毎月の応援が、新しいプロジェクトの先行支援につながります。限定リターンを先に選べるのはメンバーだけ。" },
  { en: "From ¥300", title: "月額300円から", body: "アプリ内課金ではなくWebでのお支払いなので、表示の月額がそのままの価格です。" },
  { en: `${(1 - PLATFORM_FEE_RATE) * 100}%`, title: `月額の${(1 - PLATFORM_FEE_RATE) * 100}%がアーティストに`, body: `手数料は決済手数料込みで一律。${FES_FUND_MESSAGE}` },
];

const FAQS = [
  { q: "いつ請求されますか？", a: "加入した日に1か月分をお支払いいただき、以降は毎月同じ日に自動で更新されます。" },
  { q: "解約はいつでもできますか？", a: "マイページからいつでも解約できます。解約しても、次の更新日の前日まで特典を使えます。" },
  { q: "プランの変更はできますか？", a: "できます。上位プランへの変更はすぐに、下位プランへの変更は次の更新日から反映されます。" },
  { q: "プロジェクトの支援とは別ですか？", a: "別です。メンバーシップは毎月の応援、プロジェクトは作品ごとの応援です。メンバーは新しいプロジェクトを公開前から支援できます。" },
];

export default async function MembershipPage() {
  const artists = withMembership(await getArtists());

  return (
    <div className="overflow-x-clip">
      <section className="bg-ink text-white">
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="font-en text-xs font-medium tracking-wide text-white/70">Membership</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.4] tracking-[0.12em] sm:text-6xl">
            {["毎月、", "推しのとなりに。"].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <span className="block animate-line-in" style={{ animationDelay: `${150 + i * 150}ms` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-lg animate-rise leading-loose tracking-wider text-white/80 [animation-delay:500ms]">
            ライブのない月も、制作中の長い時間も。月額メンバーシップで、アーティストの活動をいちばん近くで支えられます。
          </p>
          <Sticker shape="circle" color="yellow" size={72} className="right-6 top-16 sm:right-20" float />
          <Sticker shape="triangle" color="pink" size={44} className="bottom-12 right-24 sm:right-48" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20">
        <section className="space-y-10">
          <SectionHeading en="Why OTOFUND" ja="OTOFUNDのメンバーシップ" />
          <ul data-stagger className="grid gap-8 sm:grid-cols-3">
            {POINTS.map((p) => (
              <li key={p.title} className="group border-t-[3px] border-brand pt-5">
                <p className="font-en text-2xl font-black text-brand transition-transform duration-300 group-hover:translate-x-2">{p.en}</p>
                <p className="mt-2 font-bold tracking-wider">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-8">
          <SectionHeading en="Common perks" ja="どのメンバーシップにも付く特典" />
          <CommonPerks />
        </section>

        <section className="space-y-10">
          <SectionHeading en="Artists" ja="メンバー募集中のアーティスト" />
          <ul data-stagger className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {artists.map((a) => (
              <li key={a.id} className="border border-stone-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <MembershipArtistCard artist={a} membership={a.membership} />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-8">
          <SectionHeading en="FAQ" ja="よくある質問" />
          <dl data-stagger className="divide-y divide-stone-200 border-y border-stone-200">
            {FAQS.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-bold tracking-wider">Q. {f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-stone-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
