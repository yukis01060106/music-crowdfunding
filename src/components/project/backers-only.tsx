"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { useDemo } from "@/lib/demo-store";
import { useOpenForSupport } from "./support-cta";
import { buttonClass } from "@/components/ui/button";

/**
 * 支援者限定の本文。そのプロジェクトを支援した人にだけ見せる。
 * TODO: 本番では本文をサーバーから、支援者の認証つきで取得する（HTML に埋め込まない）
 */
export function BackersOnly({ project, body }: { project: Pick<Project, "slug" | "status" | "endAt">; body: string }) {
  const projectSlug = project.slug;
  const open = useOpenForSupport(project);
  const { backings } = useDemo();
  const backed = backings.some((b) => b.projectSlug === projectSlug);

  if (backed) return <p className="mt-2 whitespace-pre-wrap text-stone-700">{body}</p>;
  return (
    <div className="relative mt-2">
      <p className="select-none text-stone-700 blur-sm" aria-hidden>
        {body.slice(0, 60).replace(/\S/g, "■")}…
      </p>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 text-center text-sm">
        <p className="font-bold">🔒 この活動報告は支援者だけが読めます</p>
        {open && (
          <Link href={`/projects/${projectSlug}/support`} className={buttonClass("primary", "md")}>
            支援して読む
          </Link>
        )}
      </div>
    </div>
  );
}
