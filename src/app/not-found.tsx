import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getArtists, getPublicProjects } from "@/lib/data";
import { ProjectCard } from "@/components/project/project-card";
import { Sticker } from "@/components/ui/shapes";

export default async function NotFound() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  // 迷った人に、いま注目のプロジェクトを3件だけ見せる
  const picks = projects.filter((p) => p.status === "live").sort((a, b) => b.backers - a.backers).slice(0, 3);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="relative mx-auto max-w-md text-center">
        <Sticker shape="circle" color="yellow" size={56} className="-left-2 -top-4" float />
        <p className="font-en text-7xl font-black text-brand">404</p>
        <h1 className="mt-4 text-xl font-bold">ページが見つかりませんでした</h1>
        <p className="mt-2 text-sm text-stone-500">プロジェクトが終了したか、URLが変わった可能性があります。</p>
        <form action="/projects/" className="mt-6 flex gap-2">
          <label className="flex-1">
            <span className="sr-only">キーワードでさがす</span>
            <input type="search" name="q" placeholder="アーティスト名・キーワード" className="min-h-11 w-full rounded-full border border-stone-500 bg-white px-5 py-3 text-sm focus:border-brand" />
          </label>
          <button type="submit" className={buttonClass("primary", "md")}>
            さがす
          </button>
        </form>
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link href="/" className={buttonClass("secondary")}>
            トップへ
          </Link>
        </div>
      </div>
      {picks.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-center font-bold">いま注目のプロジェクト</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((p, i) => (
              <ProjectCard key={p.slug} project={p} artist={artists.find((a) => a.id === p.artistId)} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
