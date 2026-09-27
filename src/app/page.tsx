import Link from "next/link";
import { getArtists, getPublicProjects } from "@/lib/data";
import { GENRE_LABELS, type Genre } from "@/types";
import { ProjectCard } from "@/components/project/project-card";
import { ProgressBar } from "@/components/project/progress";
import { formatYen, progressPercent } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  const artistName = (id: string) => artists.find((a) => a.id === id)?.name ?? "";
  const live = projects.filter((p) => p.status === "live");

  const featured = [...live].sort((a, b) => b.backers - a.backers)[0];
  const popular = [...live].sort((a, b) => b.backers - a.backers);
  const endingSoon = [...live].sort((a, b) => a.endAt.localeCompare(b.endAt)).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-8">
      {featured && (
        <Link
          href={`/projects/${featured.slug}`}
          className={`block rounded-2xl bg-gradient-to-br ${featured.color} p-8 text-white sm:p-12`}
        >
          <p className="text-sm opacity-90">{artistName(featured.artistId)}</p>
          <h1 className="mt-2 max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">{featured.title}</h1>
          <p className="mt-3 max-w-2xl opacity-90">{featured.catchcopy}</p>
          <div className="mt-6 max-w-md space-y-2">
            <ProgressBar project={featured} />
            <p className="text-sm">
              {formatYen(featured.raised)}・{progressPercent(featured)}%達成
            </p>
          </div>
        </Link>
      )}

      <Section title="人気のプロジェクト" href="/projects">
        <Grid>
          {popular.map((p) => (
            <ProjectCard key={p.slug} project={p} artistName={artistName(p.artistId)} />
          ))}
        </Grid>
      </Section>

      <Section title="まもなく終了">
        <Grid>
          {endingSoon.map((p) => (
            <ProjectCard key={p.slug} project={p} artistName={artistName(p.artistId)} />
          ))}
        </Grid>
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

      <section className="rounded-2xl bg-stone-900 p-8 text-white sm:p-12">
        <h2 className="text-2xl font-bold">あなたの音楽を、ファンと一緒に。</h2>
        <p className="mt-2 text-stone-300">アルバム制作、ライブ、MV。0円プランや参加人数目標で、お金以外の応援も集められます。</p>
        <Link href="/start" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-medium text-stone-900">
          プロジェクトをはじめる
        </Link>
      </section>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-brand hover:underline">
            もっと見る
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
