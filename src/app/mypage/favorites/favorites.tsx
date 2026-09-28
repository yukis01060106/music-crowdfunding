"use client";

import Link from "next/link";
import type { Artist, Project } from "@/types";
import { useDemo } from "@/lib/demo-store";
import { ProjectGrid } from "@/components/project/project-grid";

export function Favorites({ projects, artists }: { projects: Project[]; artists: Artist[] }) {
  const { favorites } = useDemo();
  const list = projects.filter((p) => favorites.includes(p.slug));

  if (list.length === 0) {
    return (
      <div className="border-2 border-dashed border-stone-300 p-10 text-center">
        <p className="text-stone-500">お気に入りはまだありません。プロジェクトのページで「♡ お気に入り」を押すと、ここに並びます。</p>
        <Link href="/projects" className="mt-4 inline-block bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-brand">
          プロジェクトをさがす
        </Link>
      </div>
    );
  }
  return <ProjectGrid projects={list} artists={artists} />;
}
