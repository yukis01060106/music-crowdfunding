import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { SupportFlow } from "./support-flow";

export const metadata: Metadata = { title: "支援する", robots: { index: false } };

// 支援はログインユーザーごとに内容が変わるので、静的生成しない
export default async function SupportPage({ params, searchParams }: PageProps<"/projects/[slug]/support">) {
  const { slug } = await params;
  const { reward } = await searchParams;
  const project = await getProject(slug);
  if (!project || project.status !== "live") notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/projects/${project.slug}`} className="text-sm text-stone-500 hover:text-brand">
        ← プロジェクトに戻る
      </Link>
      <h1 className="mt-2 text-xl font-bold leading-snug">{project.title}</h1>
      <SupportFlow
        projectSlug={project.slug}
        fundingModel={project.fundingModel}
        rewards={project.rewards}
        initialRewardId={typeof reward === "string" ? reward : undefined}
      />
    </div>
  );
}
