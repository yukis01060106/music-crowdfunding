import { getArtist, getArtists } from "@/lib/data";
import { ogImage } from "@/lib/og-image";

// シェア画像は .png 付きの URL で静的に書き出す（GitHub Pages は拡張子で画像の種類を判断するため）
export const dynamic = "force-static";
// 決まったプロジェクト・アーティストの分だけ。ほかの URL で重い画像生成を起こさせない
export const dynamicParams = false;

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map((a) => ({ id: a.id }));
}

/** アーティストのシェア画像。写真を横長に切り抜く */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtist(id);
  return ogImage({ photo: artist?.photo ?? "/images/records-wall.jpg", label: "ARTIST ON OTOFUND", badge: artist?.membership ? "MEMBERSHIP" : undefined });
}
