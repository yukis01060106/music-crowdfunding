import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { BackersOnly } from "@/components/project/backers-only";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]/updates">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  // 親の layout が title を文字列で返すとサイト名のテンプレートが届かないので、ここで付ける
  return {
    title: { absolute: `${project.title}の活動報告｜${SITE_NAME}` },
    description: `「${project.title}」の制作の様子をお届けする活動報告。`,
    alternates: { canonical: `/projects/${slug}/updates/` },
  };
}

export default async function ProjectUpdatesPage({ params }: PageProps<"/projects/[slug]/updates">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  if (project.updates.length === 0) {
    return <p className="py-10 text-center text-stone-500">まだ活動報告はありません。</p>;
  }

  return (
    <ol className="space-y-4">
      {[...project.updates].reverse().map((u) => (
        <li key={u.id} className="animate-rise border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">
            {formatDate(u.publishedAt)}
            {u.backersOnly && <span className="ml-2 bg-amber-100 px-1.5 py-0.5 text-amber-700">支援者限定</span>}
          </p>
          <h2 className="mt-1 font-bold">{u.title}</h2>
          {u.backersOnly ? <BackersOnly project={project} body={u.body} /> : <p className="mt-2 whitespace-pre-wrap text-stone-700">{u.body}</p>}
        </li>
      ))}
    </ol>
  );
}
