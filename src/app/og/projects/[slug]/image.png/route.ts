import { getProject, getPublicProjects } from "@/lib/data";
import { progressPercent } from "@/lib/format";
import { ogImage } from "@/lib/og-image";

// シェア画像は .png 付きの URL で静的に書き出す（GitHub Pages は拡張子で画像の種類を判断するため）
export const dynamic = "force-static";
// 決まったプロジェクト・アーティストの分だけ。ほかの URL で重い画像生成を起こさせない
export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

/** プロジェクトのシェア画像。カバー写真に、達成率を重ねる */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return ogImage({ photo: "/images/records-wall.jpg", label: "MUSIC CROWDFUNDING" });
  return ogImage({ photo: project.cover, label: "MUSIC CROWDFUNDING", badge: `${progressPercent(project)}%` });
}
