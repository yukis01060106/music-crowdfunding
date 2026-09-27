import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProject, getPublicProjects } from "@/lib/data";
import { SupportFlow } from "./support-flow";

export const metadata: Metadata = { title: "支援する", robots: { index: false } };

// 画面の枠だけを静的生成し、選択中のリターン（?reward=）はブラウザ側で読む
export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.filter((p) => p.status === "live").map((p) => ({ slug: p.slug }));
}

export default async function SupportPage({ params }: PageProps<"/projects/[slug]/support">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project || project.status !== "live") notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/projects/${project.slug}`} className="text-sm text-stone-500 hover:text-brand">
        ← プロジェクトに戻る
      </Link>
      <h1 className="mt-2 text-xl font-bold leading-snug">{project.title}</h1>
      <Suspense>
        <SupportFlow
          projectSlug={project.slug}
          projectTitle={project.title}
          fundingModel={project.fundingModel}
          rewards={project.rewards}
        />
      </Suspense>
    </div>
  );
}
