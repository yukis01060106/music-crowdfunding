import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getArtist, getProject, getPublicProjects } from "@/lib/data";
import { Photo } from "@/components/ui/photo";
import { SupportFlow } from "./support-flow";

export const metadata: Metadata = { title: "支援する", robots: { index: false } };

// 画面の枠だけを静的生成し、選択中のリターン（?reward=）はブラウザ側で読む。
// 終了したプロジェクトも生成して、シェアや検索から来た人に「募集は終了しました」と案内する
export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function SupportPage({ params }: PageProps<"/projects/[slug]/support">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const artist = await getArtist(project.artistId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/projects/${project.slug}`} className="text-sm text-stone-500 hover:text-brand">
        ← プロジェクトに戻る
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <span className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden sm:w-20">
          <Photo src={project.cover} alt="" sizes="80px" />
        </span>
        <div className="min-w-0">
          {artist && <p className="text-xs font-bold text-stone-500">{artist.name}</p>}
          <h1 className="text-xl font-black leading-snug tracking-[0.08em] sm:text-2xl">{project.title}</h1>
        </div>
      </div>
      <Suspense>
        <SupportFlow
          project={project}
          projectSlug={project.slug}
          projectTitle={project.title}
          fundingModel={project.fundingModel}
          rewards={project.rewards}
        />
      </Suspense>
    </div>
  );
}
