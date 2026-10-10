"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { useNow } from "@/lib/use-now";

/** 募集中か。状態が live でも、終了日時を過ぎていたら受け付けない */
export function isOpenForSupport(project: Pick<Project, "status" | "endAt">, now: number | null): boolean {
  if (project.status !== "live") return false;
  return now === null || new Date(project.endAt).getTime() > now;
}

export function useOpenForSupport(project: Pick<Project, "status" | "endAt">): boolean {
  return isOpenForSupport(project, useNow());
}

/**
 * 支援ページへのボタン。募集が終わっていたら、押せない「募集は終了しました」に替える
 * （終了後の支援ページは「募集は終了しました」の案内だけなので、ボタンを押せる形で残さない）。
 */
export function SupportCta({
  project,
  href,
  className,
  children,
}: {
  project: Pick<Project, "slug" | "status" | "endAt">;
  href?: string;
  className: string;
  children: React.ReactNode;
}) {
  const open = useOpenForSupport(project);
  if (!open) {
    return (
      <span className={`${className} pointer-events-none bg-stone-200! text-stone-600!`} aria-disabled="true">
        募集は終了しました
      </span>
    );
  }
  return (
    <Link href={href ?? `/projects/${project.slug}/support`} className={className}>
      {children}
    </Link>
  );
}
