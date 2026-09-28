import type { Metadata } from "next";
import Link from "next/link";
import { FES_FUND_MESSAGE } from "@/lib/fees";
import { Photo } from "@/components/ui/photo";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpinBadge } from "@/components/motion/spin-badge";
import { TextMarquee } from "@/components/motion/text-marquee";
import { FesSignup } from "./fes-signup";

export const metadata: Metadata = {
  title: "ONE NOTE FES",
  description: "OTOFUNDから生まれる、ファンと共に創る音楽フェス（企画中）。",
  openGraph: { title: "ONE NOTE FES", description: "ファンと共に創るフェス（企画中）", images: [{ url: "/images/one-note-fes.jpg", alt: "ONE NOTE FES by otofund" }] },
};

// 企画中なので、決まっていないこと（日程・会場・出演者）は書かない。構想として伝える
const PILLARS = [
  {
    en: "Together",
    title: "ファンと共に創る",
    body: "どんなフェスにしたいか、誰の音楽を聴きたいか。ファンの声と応援で、フェスの形を決めていく構想です。",
  },
  {
    en: "One note",
    title: "すべてのアーティストが、ひとつの音に",
    body: "メジャーから高校生バンドまで。OTOFUNDで挑戦したアーティストが、同じステージでひとつになる瞬間を目指します。",
  },
  {
    en: "Funded by you",
    title: "あなたの支援が、フェスになる",
    body: FES_FUND_MESSAGE,
  },
];

const WAYS = [
  { title: "プロジェクトを支援する", body: "どのプロジェクトへの支援も、手数料の一部がフェスの開催費用になります。", href: "/projects", cta: "プロジェクトをさがす" },
  { title: "メンバーになる", body: "メンバーシップに入ると、フェスの情報をいちばん先にお届けします。", href: "/membership", cta: "メンバーシップを見る" },
  { title: "アーティストとして挑戦する", body: "OTOFUNDでプロジェクトを立ち上げて、フェスのステージを目指しませんか。", href: "/start", cta: "プロジェクトをはじめる" },
];

export default function FesPage() {
  return (
    <div className="overflow-x-clip bg-ink text-white">
      <section className="relative">
        <div className="relative h-[70vh] min-h-[460px] w-full">
          <Photo src="/images/one-note-fes.jpg" alt="ONE NOTE FES by otofund" sizes="100vw" priority className="animate-fade" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" aria-hidden />
        </div>
        <div className="relative mx-auto -mt-40 max-w-6xl px-4 pb-16">
          <p className="inline-block animate-rise bg-pop-yellow px-3 py-1 text-sm font-black tracking-widest text-ink">企画中</p>
          <h1 className="mt-4 font-en text-5xl font-black tracking-tight sm:text-8xl">
            <span className="block overflow-hidden">
              <span className="block animate-line-in [animation-delay:150ms]">ONE NOTE</span>
            </span>
            <span className="block overflow-hidden">
              <span className="block animate-line-in bg-gradient-to-r from-pop-yellow via-pop-pink to-brand bg-clip-text text-transparent [animation-delay:300ms]">
                FES
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg font-bold leading-loose tracking-[0.12em] [animation-delay:500ms] sm:text-2xl">
            ファンと共に創るフェス。
            <br />
            すべてのアーティストとファンが、ひとつになる瞬間を。
          </p>
          <SpinBadge text="ONE NOTE FES ✦ BY OTOFUND ✦ " center={<>COMING<br />SOON</>} size={130} className="absolute right-4 top-6 hidden sm:block" />
        </div>
      </section>

      <TextMarquee words={["ONE NOTE FES", "FANS", "ARTISTS", "TOGETHER"]} tone="brand" />

      <section className="mx-auto max-w-6xl space-y-12 px-4 py-24">
        <SectionHeading en="Concept" ja="ONE NOTE FES とは" dark />
        <ol data-stagger className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="group relative overflow-hidden border border-white/20 p-6 transition duration-500 hover:-translate-y-2 hover:border-pop-yellow">
              <span className="absolute -right-4 -top-6 font-en text-8xl font-black text-white/5 transition group-hover:text-pop-yellow/10" aria-hidden>
                0{i + 1}
              </span>
              <p className="font-en text-sm font-bold text-pop-yellow">{p.en}</p>
              <p className="mt-2 text-lg font-bold tracking-wider">{p.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-24 text-ink">
        <div className="mx-auto max-w-6xl space-y-12 px-4">
          <SectionHeading en="Join" ja="フェスに参加する、3つの方法" lead="開催はまだ先ですが、いまからフェスづくりに参加できます。" />
          <ul data-stagger className="grid gap-6 md:grid-cols-3">
            {WAYS.map((w) => (
              <li key={w.title}>
                <Link href={w.href} className="group flex h-full flex-col border-[3px] border-ink p-6 transition duration-300 hover:-translate-y-1 hover:bg-ink hover:text-white">
                  <p className="text-lg font-bold tracking-wider">{w.title}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed opacity-70">{w.body}</p>
                  <p className="mt-6 font-bold text-brand group-hover:text-pop-yellow">
                    {w.cta} <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div data-reveal="up">
          <p className="font-en text-xs tracking-wide text-white/60">Newsletter</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[0.12em] sm:text-3xl">続報をお届けします</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">日程・会場・出演者は、決まりしだいお知らせします。</p>
          <div className="mt-8 text-left">
            <FesSignup />
          </div>
        </div>
      </section>
    </div>
  );
}
