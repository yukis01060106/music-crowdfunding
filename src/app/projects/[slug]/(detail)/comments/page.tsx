import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";
import { formatDate, formatYen } from "@/lib/format";
import { MyComments } from "@/components/project/my-comments";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]/comments">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  // 親の layout が title を文字列で返すとサイト名のテンプレートが届かないので、ここで付ける
  return {
    title: { absolute: `${project.title}の応援コメント｜${SITE_NAME}` },
    description: `「${project.title}」の支援者から届いた応援コメント。`,
    alternates: { canonical: `/projects/${slug}/comments/` },
  };
}

export default async function ProjectCommentsPage({ params }: PageProps<"/projects/[slug]/comments">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <ul className="space-y-4">
      <MyComments projectSlug={project.slug} />
      {project.comments.length === 0 && <li className="py-10 text-center text-stone-500">まだ応援コメントはありません。支援するとコメントを残せます。</li>}
      {project.comments.map((c) => (
        <li key={c.id} className="border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">{c.userName}</span>
            <span className="text-stone-500">
              {c.amount === 0 ? "0円で参加" : `${formatYen(c.amount)}で支援`}・{formatDate(c.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-stone-700">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
