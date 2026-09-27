import { getArtists, getPublicProjects } from "@/lib/data";
import { PageTitle } from "@/components/side-nav";
import { ProjectGrid } from "@/components/project/project-grid";

export default async function FavoritesPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  // モック: お気に入り登録済みのプロジェクト
  const favorites = projects.filter((p) => p.slug === "mio-aoki-live-album");

  return (
    <>
      <PageTitle>お気に入り</PageTitle>
      <p className="mb-4 text-sm text-stone-500">お気に入りのプロジェクトは、活動報告の更新や終了前にお知らせします。</p>
      <ProjectGrid projects={favorites} artists={artists} />
    </>
  );
}
