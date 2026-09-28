import { getArtists, getPublicProjects } from "@/lib/data";
import { PageTitle } from "@/components/side-nav";
import { Favorites } from "./favorites";

export default async function FavoritesPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);

  return (
    <>
      <PageTitle>お気に入り</PageTitle>
      <p className="mb-4 text-sm text-stone-500">お気に入りのプロジェクトは、活動報告の更新や、終了の3日前にお知らせします。</p>
      <Favorites projects={projects} artists={artists} />
    </>
  );
}
