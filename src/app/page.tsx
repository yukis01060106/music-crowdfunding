import Link from "next/link";
import { getArtists, getPublicProjects } from "@/lib/data";
import { ARTIST_TYPE_LABELS, GENRE_LABELS, REWARD_KIND_LABELS, type ArtistType, type Genre } from "@/types";
import { ProjectCard } from "@/components/project/project-card";
import { ProgressBar } from "@/components/project/progress";
import { formatNumber, formatYen, progressPercent } from "@/lib/format";

export const revalidate = 300;

/** 気軽に応援できる価格の上限。支援者の約半数は1回の予算が1万円未満 */
const SMALL_BUDGET = 3000;

const HOW_IT_WORKS = [
  { title: "応援したい音楽を見つける", body: "試聴して、アーティストの想いを読んで、気に入ったら。" },
  { title: "リターンを選んで支援", body: "会員登録なしでOK。0円で参加できるプランもあります。" },
  { title: "音楽とリターンが届く", body: "制作の様子は活動報告で。完成したら、あなたの手元へ。" },
];

export default async function HomePage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  const artistOf = (id: string) => artists.find((a) => a.id === id);
  const live = projects.filter((p) => p.status === "live");

  const popular = [...live].sort((a, b) => b.backers - a.backers);
  const featured = popular[0];
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

  return (
    <div>
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_420px] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-medium tracking-widest text-violet-300">MUSIC CROWDFUNDING</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
              好きなアーティストの
              <br />
              「次の一歩」を、
              <br />
              いちばん近くで。
            </h1>
            <p className="mt-5 max-w-lg leading-relaxed text-stone-300">
              アルバム、ライブ、MV。音楽が生まれる前から応援して、完成したらいちばんに受け取る。
              メジャーから高校生バンドまで、音楽のためのクラウドファンディングです。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projects" className="rounded-full bg-white px-6 py-3 font-bold text-stone-900 hover:bg-stone-200">
                プロジェクトをさがす
              </Link>
              <Link href="/start" className="rounded-full border border-white/40 px-6 py-3 font-bold hover:bg-white/10">
                アーティストの方へ
              </Link>
            </div>
            <dl className="mt-10 flex gap-8 text-sm">
              <div>
                <dt className="text-stone-400">累計支援額</dt>
                <dd className="text-2xl font-bold">{formatYen(totalRaised)}</dd>
              </div>
              <div>
                <dt className="text-stone-400">支援者</dt>
                <dd className="text-2xl font-bold">{formatNumber(totalBackers)}人</dd>
              </div>
            </dl>
          </div>

          {featured && (
            <Link href={`/projects/${featured.slug}`} className="group block overflow-hidden rounded-2xl bg-white text-stone-900 shadow-2xl">
              <div className={`aspect-video bg-gradient-to-br ${featured.color} p-4`}>
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold">いま注目</span>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-xs text-stone-500">{artistOf(featured.artistId)?.name}</p>
                <p className="font-bold leading-snug group-hover:text-brand">{featured.title}</p>
                <ProgressBar project={featured} />
                <p className="text-sm">
                  <span className="font-bold">{formatYen(featured.raised)}</span>
                  <span className="ml-2 font-bold text-brand">{progressPercent(featured)}%</span>
                  <span className="ml-2 text-stone-500">{formatNumber(featured.backers)}人が支援</span>
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section aria-labelledby="how" className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="how" className="text-xl font-bold">はじめての方へ</h2>
            <Link href="/help" className="text-sm text-brand hover:underline">
              よくある質問
            </Link>
          </div>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            ✓ 多くのプロジェクトは「目標に届かなければお支払いなし」。表示価格はすべて税込・送料込みです。
          </p>
        </section>

        <Section title="注目のプロジェクト" href="/projects">
          <Grid>
            {popular.slice(0, 6).map((p) => (
              <ProjectCard key={p.slug} project={p} artist={artistOf(p.artistId)} />
            ))}
          </Grid>
        </Section>

        <Section title="まもなく終了" lead="支援できるのはあと少し。">
          <Grid>
            {endingSoon.map((p) => (
              <ProjectCard key={p.slug} project={p} artist={artistOf(p.artistId)} />
            ))}
          </Grid>
        </Section>

        <Section title={`${formatYen(SMALL_BUDGET)}以下で応援できるリターン`} lead="はじめての支援にも。">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {smallRewards.map(({ project, reward }) => (
              <li key={`${project.slug}-${reward.id}`}>
                <Link
                  href={`/projects/${project.slug}/support?reward=${reward.id}`}
                  className="flex h-full gap-4 rounded-xl border border-stone-200 bg-white p-4 hover:border-brand"
                >
                  <span className={`h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br ${project.color}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="text-lg font-bold">{formatYen(reward.price)}</span>
                    <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-xs text-brand">
                      {REWARD_KIND_LABELS[reward.kind]}
                    </span>
                    <span className="mt-1 block truncate text-sm font-medium">{reward.title}</span>
                    <span className="block truncate text-xs text-stone-500">{artistOf(project.artistId)?.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="アーティストタイプからさがす">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(ARTIST_TYPE_LABELS) as ArtistType[]).map((t) => (
              <Link
                key={t}
                href={`/types/${t}`}
                className="rounded-xl border border-stone-200 bg-white px-4 py-5 text-center font-bold hover:border-brand hover:text-brand"
              >
                {ARTIST_TYPE_LABELS[t]}
              </Link>
            ))}
          </div>
        </Section>

        <Section title="ジャンルからさがす">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
              <Link
                key={g}
                href={`/genres/${g}`}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm hover:border-brand hover:text-brand"
              >
                {GENRE_LABELS[g]}
              </Link>
            ))}
          </div>
        </Section>

        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-fuchsia-600 p-8 text-white sm:p-12">
          <h2 className="text-2xl font-bold">あなたの音楽を、ファンと一緒に。</h2>
          <p className="mt-2 max-w-xl text-white/90">
            アルバム制作、ライブ、MV。0円プランや参加人数目標で、お金以外の応援も集められます。
          </p>
          <Link href="/start" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-bold text-stone-900">
            プロジェクトをはじめる
          </Link>
        </section>
      </div>
    </div>
  );
}

function Section({
  title,
  lead,
  href,
  children,
}: {
  title: string;
  lead?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {lead && <p className="mt-1 text-sm text-stone-500">{lead}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm text-brand hover:underline">
            すべて見る →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
