import type { MetadataRoute } from "next";
import { getArtists, getPublicProjects } from "@/lib/data";
import { LEGAL_DOCS } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";
import { ARTIST_TYPE_LABELS, GENRE_LABELS } from "@/types";

export const dynamic = "force-static";

// 静的サイトでは末尾スラッシュ付きの URL で配信する
const url = (path: string) => `${SITE_URL}${path}${path.endsWith("/") ? "" : "/"}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  const fixed = ["/", "/projects", "/artists", "/membership", "/fes", "/start", "/help", "/contact"];
  return [
    ...fixed.map((p) => ({ url: url(p), changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.7 })),
    ...projects.map((p) => ({ url: url(`/projects/${p.slug}`), lastModified: p.updates.at(-1)?.publishedAt ?? p.startAt, priority: 0.9 })),
    ...artists.map((a) => ({ url: url(`/artists/${a.id}`), priority: 0.6 })),
    ...Object.keys(GENRE_LABELS).map((g) => ({ url: url(`/genres/${g}`), priority: 0.5 })),
    ...Object.keys(ARTIST_TYPE_LABELS).map((t) => ({ url: url(`/types/${t}`), priority: 0.5 })),
    ...LEGAL_DOCS.map((d) => ({ url: url(`/legal/${d.slug}`), priority: 0.2 })),
  ];
}
