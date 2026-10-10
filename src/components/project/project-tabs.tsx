"use client";

import Link from "next/link";
import { samePath } from "@/lib/path";
import { useDemo } from "@/lib/demo-store";
import { usePathname } from "next/navigation";

export function ProjectTabs({
  slug,
  updateCount,
  commentCount,
}: {
  slug: string;
  updateCount: number;
  commentCount: number;
}) {
  const pathname = usePathname();
  // 実行者の画面から投稿した活動報告も数える
  const { postedUpdates } = useDemo();
  const posted = postedUpdates.filter((u) => u.projectSlug === slug).length;
  const base = `/projects/${slug}`;
  const tabs = [
    { href: base, label: "ストーリー" },
    { href: `${base}/updates`, label: `活動報告 ${updateCount + posted}` },
    { href: `${base}/comments`, label: `応援コメント ${commentCount}` },
  ];

  return (
    <nav aria-label="プロジェクトの情報" className="flex gap-1 overflow-x-auto border-b border-stone-200 pt-1">
      {tabs.map((tab) => {
        const active = samePath(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${
              active ? "border-brand text-brand" : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
