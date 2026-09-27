"use client";

import Link from "next/link";
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
  const base = `/projects/${slug}`;
  const tabs = [
    { href: base, label: "ストーリー" },
    { href: `${base}/updates`, label: `活動報告 ${updateCount}` },
    { href: `${base}/comments`, label: `応援コメント ${commentCount}` },
  ];

  return (
    <nav className="flex gap-1 border-b border-stone-200">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium ${
              active ? "border-brand text-brand" : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
