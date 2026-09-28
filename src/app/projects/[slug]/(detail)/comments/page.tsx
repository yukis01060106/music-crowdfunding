import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { formatDate, formatYen } from "@/lib/format";
import { MyComments } from "@/components/project/my-comments";

export const metadata: Metadata = { title: "応援コメント" };

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
              {formatYen(c.amount)}で支援・{formatDate(c.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-stone-700">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
