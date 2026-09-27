import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "活動報告" };

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
        <li key={u.id} className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">
            {formatDate(u.publishedAt)}
            {u.backersOnly && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">支援者限定</span>}
          </p>
          <h2 className="mt-1 font-bold">{u.title}</h2>
          {/* TODO: 支援者限定の本文は、ログイン中の支援者だけにクライアント側で取得して表示する */}
          <p className="mt-2 text-stone-700">{u.backersOnly ? "この活動報告は支援者だけが読めます。" : u.body}</p>
        </li>
      ))}
    </ol>
  );
}
