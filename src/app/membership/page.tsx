import type { Metadata } from "next";
import { getArtists } from "@/lib/data";
import { MEMBERSHIP_MIN_PRICE, PLAN_CHANGE_RULE, withMembership } from "@/lib/membership";
import { formatYen } from "@/lib/format";
import { CommonPerks } from "@/components/membership/common-perks";
import { MembershipArtistCard } from "@/components/membership/membership-artist-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";

export const metadata: Metadata = { title: "メンバーシップ", description: "月額で、好きなアーティストを毎月応援。メンバーは新しいプロジェクトを公開前から支援できます。", alternates: { canonical: "/membership/" } };

const POINTS = [
  { en: "Linked", title: "クラファンとつながる", body: "毎月の応援が、新しいプロジェクトの先行支援につながります。限定リターンを先に選べるのはメンバーだけ。" },
  { en: `From ${formatYen(MEMBERSHIP_MIN_PRICE)}`, title: `月額${formatYen(MEMBERSHIP_MIN_PRICE)}から`, body: "表示の月額のほかに、手数料などの費用はかかりません。" },
  { en: "FES", title: "応援が、フェスにもつながる", body: "あなたの応援の一部が、ONE NOTE FES の開催費用になります。" },
];

const FAQS = [
  { q: "いつ請求されますか？", a: "加入した日に1か月分をお支払いいただき、以降は毎月同じ日（その日がない月は月末）に自動で更新されます。" },
  { q: "解約はいつでもできますか？", a: "マイページからいつでも解約できます。解約しても、次の更新日の前日まで特典を使えます。" },
  { q: "プランの変更はできますか？", a: `できます。${PLAN_CHANGE_RULE}` },
  { q: "プロジェクトの支援とは別ですか？", a: "別です。メンバーシップは毎月の応援、プロジェクトは作品ごとの応援です。メンバーは新しいプロジェクトを公開前から支援できます。" },
];

export default async function MembershipPage() {
  const artists = withMembership(await getArtists());

  return (
    <div className="overflow-x-clip">
      <section className="bg-ink text-white">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:py-28 lg:grid-cols-2">
          <div>
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
          <a href="#artists" className="mt-8 inline-flex min-h-11 animate-rise items-center bg-pop-yellow px-7 py-3.5 font-bold tracking-wider text-ink transition [animation-delay:650ms] hover:bg-white">
            メンバー募集中のアーティストを見る <span aria-hidden className="ml-1">↓</span>
          </a>
          </div>
          {/* メンバー募集中のアーティストの写真を、少し傾けて重ねる */}
          <div className="relative hidden h-[440px] lg:block" aria-hidden>
            {artists.slice(0, 3).map((a, i) => (
              <div
                key={a.id}
                className={`absolute aspect-[3/4] w-56 overflow-hidden border-[3px] bg-brand-soft shadow-2xl ${
                  ["left-4 top-10 rotate-[-6deg] border-pop-yellow", "left-1/2 top-0 z-10 -translate-x-1/2 rotate-[3deg] border-pop-pink", "right-4 top-24 rotate-[8deg] border-pop-teal"][i]
                }`}
              >
                <Photo src={a.photo} alt="" sizes="224px" />
              </div>
            ))}
            <Sticker shape="circle" color="yellow" size={72} className="-top-4 right-10 z-20" float />
            <Sticker shape="triangle" color="pink" size={44} className="bottom-6 left-16 z-20" />
          </div>
          {/* スマホでは、写真を横に3枚並べる */}
          <div className="flex gap-2 lg:hidden" aria-hidden>
            {artists.slice(0, 3).map((a, i) => (
              <div key={a.id} className={`relative aspect-[3/4] flex-1 overflow-hidden border-[3px] bg-brand-soft ${["rotate-[-3deg] border-pop-yellow", "translate-y-3 border-pop-pink", "rotate-[3deg] border-pop-teal"][i]}`}>
                <Photo src={a.photo} alt="" sizes="33vw" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20">
        <section className="space-y-10">
          <SectionHeading en="Why Oto Fund" ja="Oto Fundのメンバーシップ" />
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

        <section id="artists" className="scroll-mt-20 space-y-10">
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
