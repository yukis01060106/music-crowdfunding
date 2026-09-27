import Link from "next/link";
import { getArtists, getPublicProjects } from "@/lib/data";
import { ARTIST_TYPE_LABELS, GENRE_LABELS, REWARD_KIND_LABELS, type ArtistType, type Genre } from "@/types";
import { ProjectCard, FRAME_COLORS } from "@/components/project/project-card";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";
import { CircleLink, SectionHeading } from "@/components/ui/section-heading";
import { HeroPhotoColumns } from "@/components/home/hero-photo-columns";
import { VoicesMarquee } from "@/components/home/voices-marquee";

export const revalidate = 300;

/** 気軽に応援できる価格の上限。支援者の約半数は1回の予算が1万円未満 */
const SMALL_BUDGET = 3000;

const HOW_IT_WORKS = [
  { en: "Find", title: "応援したい音楽を見つける", body: "試聴して、アーティストの想いを読んで、気に入ったら。" },
  { en: "Support", title: "リターンを選んで支援", body: "会員登録なしでOK。0円で参加できるプランもあります。" },
  { en: "Receive", title: "音楽とリターンが届く", body: "制作の様子は活動報告で。完成したら、あなたの手元へ。" },
];

export default async function HomePage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  const artistOf = (id: string) => artists.find((a) => a.id === id);
  const live = projects.filter((p) => p.status === "live");

  const popular = [...live].sort((a, b) => b.backers - a.backers);
  const endingSoon = [...live].sort((a, b) => a.endAt.localeCompare(b.endAt)).slice(0, 3);
  const smallRewards = live
    .flatMap((p) =>
      p.rewards
        .filter((r) => r.price > 0 && r.price <= SMALL_BUDGET && (r.limit === undefined || r.backers < r.limit))
        .map((r) => ({ project: p, reward: r })),
    )
    .sort((a, b) => b.reward.backers - a.reward.backers)
    .slice(0, 6);

  const totalRaised = projects.reduce((sum, p) => sum + p.raised, 0);
  const totalBackers = projects.reduce((sum, p) => sum + p.backers, 0);
  const achieved = projects.filter((p) => progressPercent(p) >= 100).length;

  return (
    <div className="overflow-x-clip">
      {/* ヒーロー：スマホでは写真が先、PCではコピーが左 */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-4 lg:grid-cols-[1fr_540px] lg:items-center lg:gap-16 lg:pt-8">
        <div className="order-2 pb-4 lg:order-1">
          <p className="text-lg font-bold tracking-[0.15em]">“好き”を“次の一歩”に</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.35] tracking-[0.12em] sm:text-6xl">
            音楽は、
            <br />
            ファンと
            <br />
            つくる。
          </h1>
          <p className="mt-6 max-w-md text-sm font-medium leading-loose tracking-wider text-stone-700">
            OTOFUNDは、アルバム・ライブ・MVなど、アーティストの「これから」を
            ファンが支援する、音楽のためのクラウドファンディングです。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projects" className="bg-ink px-7 py-4 font-bold tracking-wider text-white hover:bg-brand">
              プロジェクトをさがす <span aria-hidden>→</span>
            </Link>
            <Link href="/start" className="border-2 border-ink px-7 py-3.5 font-bold tracking-wider hover:bg-stone-100">
              アーティストの方へ
            </Link>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <HeroPhotoColumns />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-28 px-4 py-24">
        <section className="space-y-10">
          <SectionHeading en="Pickup" ja="注目のプロジェクト" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {popular.slice(0, 6).map((p, i) => (
              <ProjectCard key={p.slug} project={p} artist={artistOf(p.artistId)} index={i} />
            ))}
          </div>
          <div className="flex justify-end">
            <CircleLink href="/projects" color="teal" />
          </div>
        </section>

        <section className="relative border-[3px] border-pop-teal p-8 sm:p-12">
          <Sticker shape="triangle" color="purple" size={56} className="-right-5 -top-7" float />
          <SectionHeading en="How it works" ja="はじめての方へ" />
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title}>
                <p className="font-en text-5xl font-black text-pop-teal/25">0{i + 1}</p>
                <p className="-mt-3 font-en text-xs font-bold tracking-wide text-pop-teal">{s.en}</p>
                <p className="mt-2 font-bold tracking-wider">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 bg-stone-100 p-4 text-sm font-medium tracking-wide">
            ✓ 多くのプロジェクトは「目標に届かなければお支払いなし」。表示価格はすべて税込・送料込みです。
            <Link href="/help" className="ml-2 text-pop-teal underline">
              よくある質問
            </Link>
          </p>
        </section>

        <section className="space-y-10">
          <SectionHeading en="Ending soon" ja="まもなく終了" lead="支援できるのはあと少し。" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {endingSoon.map((p, i) => (
              <ProjectCard key={p.slug} project={p} artist={artistOf(p.artistId)} index={i + 1} />
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <SectionHeading en="Small start" ja={`${formatYen(SMALL_BUDGET)}以下で応援できる`} lead="はじめての支援にも。" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {smallRewards.map(({ project, reward }) => (
              <li key={`${project.slug}-${reward.id}`}>
                <Link
                  href={`/projects/${project.slug}/support?reward=${reward.id}`}
                  className="group flex h-full gap-4 bg-stone-100 p-3 hover:bg-brand-soft"
                >
                  <span className="relative h-24 w-20 shrink-0 overflow-hidden">
                    <Photo src={project.cover} alt="" sizes="80px" />
                  </span>
                  <span className="min-w-0 py-1">
                    <span className="font-en text-2xl font-black">{formatYen(reward.price)}</span>
                    <span className="mt-1 block text-[11px] font-bold text-brand">{REWARD_KIND_LABELS[reward.kind]}</span>
                    <span className="mt-1 block truncate text-sm font-bold">{reward.title}</span>
                    <span className="block truncate text-xs text-stone-500">{artistOf(project.artistId)?.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-10">
          <SectionHeading en="Data" ja="数字で見るOTOFUND" />
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat label="累計支援額" value={formatYen(totalRaised)} />
            <Stat label="支援者" value={formatNumber(totalBackers)} unit="人" />
            <Stat label="目標達成プロジェクト" value={`${achieved}/${projects.length}`} unit="件" />
          </dl>
        </section>
      </div>

      <section className="space-y-10 pb-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading en="Voices" ja="支援者の声" />
        </div>
        <VoicesMarquee projects={projects} />
      </section>

      {/* アーティスト：黒背景に、色枠の写真を段違いで並べる */}
      <section className="bg-ink py-24 text-white">
        <div className="mx-auto max-w-6xl space-y-14 px-4">
          <SectionHeading en="Artists" ja="挑戦中のアーティスト" dark />
          <ul className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {artists.map((a, i) => (
              <li key={a.id} className={i % 2 === 1 ? "sm:translate-y-8" : ""}>
                <Link href={`/artists/${a.id}`} className={`group block border-[3px] bg-white p-3 text-ink ${FRAME_COLORS[i % FRAME_COLORS.length]}`}>
                  <span className="relative block aspect-square overflow-hidden">
                    <Photo src={a.photo} alt={a.name} sizes="(min-width: 1024px) 240px, 45vw" className="transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-3 block truncate font-bold tracking-wider">{a.name}</span>
                  <span className="mt-1 block truncate text-[11px] text-stone-500">
                    {a.types.map((t) => ARTIST_TYPE_LABELS[t]).join(" / ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-6">
            <p className="mb-4 font-en text-xs tracking-wide text-white/70">Artist type</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ARTIST_TYPE_LABELS) as ArtistType[]).map((t) => (
                <Link key={t} href={`/types/${t}`} className="border border-white/40 px-4 py-2 text-sm font-bold tracking-wider hover:bg-white hover:text-ink">
                  {ARTIST_TYPE_LABELS[t]}
                </Link>
              ))}
            </div>
            <p className="mb-4 mt-8 font-en text-xs tracking-wide text-white/70">Genre</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
                <Link key={g} href={`/genres/${g}`} className="border border-white/40 px-4 py-2 text-sm tracking-wider hover:bg-white hover:text-ink">
                  {GENRE_LABELS[g]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 lg:grid-cols-2">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
          <div className="absolute inset-0 translate-x-4 translate-y-4 bg-pop-yellow" aria-hidden />
          <div className="relative h-full overflow-hidden">
            <Photo src="/images/bass-studio.jpg" alt="" sizes="(min-width: 1024px) 380px, 90vw" />
          </div>
          <Sticker shape="circle" color="pink" size={70} className="-left-6 -top-6" float />
          <Sticker shape="triangle" color="blue" size={40} className="-bottom-4 right-10" />
        </div>
        <div>
          <SectionHeading en="For artists" ja="あなたの音楽を、ファンと一緒に。" />
          <p className="mt-6 leading-loose tracking-wider text-stone-700">
            アルバム制作、ライブ、MV。0円プランや参加人数目標で、お金以外の応援も集められます。
            メジャーから高校生バンドまで、掲載は無料です。
          </p>
          <div className="mt-8">
            <CircleLink href="/start" color="purple">
              プロジェクトをはじめる
            </CircleLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-stone-100 px-6 py-8 text-center">
      <dt className="text-sm font-bold tracking-wider">{label}</dt>
      <dd className="mt-3 font-en text-4xl font-black text-pop-blue sm:text-5xl">
        {value}
        {unit && <span className="ml-1 text-base">{unit}</span>}
      </dd>
    </div>
  );
}
