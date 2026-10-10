"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { useNow } from "@/lib/use-now";
import { useAdmin } from "@/lib/admin-store";

/** 募集中か。状態が live でも、終了日時を過ぎていたら受け付けない */
export function isOpenForSupport(project: Pick<Project, "status" | "endAt">, now: number | null): boolean {
  if (project.status !== "live") return false;
  return now === null || new Date(project.endAt).getTime() > now;
}

/**
 * 運営が掲載を停止しているか（運営の画面での停止が、公開のページにも反映される）
 * TODO（本番）: 停止の状態は DB に持ち、/api/checkout でも停止中のプロジェクトは 409 で断る。JSON-LD の availability も OutOfStock にする
 */
export function useSuspended(slug?: string): boolean {
  const { suspendedProjects } = useAdmin();
  return slug ? Boolean(suspendedProjects[slug]) : false;
}

export function useOpenForSupport(project: Pick<Project, "status" | "endAt"> & { slug?: string }): boolean {
  const suspended = useSuspended(project.slug);
  const open = isOpenForSupport(project, useNow());
  return open && !suspended;
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
  const suspended = useSuspended(project.slug);
  if (!open) {
    return (
      <span className={`${className} pointer-events-none bg-stone-200! text-stone-600!`} aria-disabled="true">
        {suspended ? "支援の受付を停止しています" : "募集は終了しました"}
      </span>
    );
  }
  return (
    <Link href={href ?? `/projects/${project.slug}/support`} className={className}>
      {children}
    </Link>
  );
}

/** 運営が掲載を停止しているときに、プロジェクトのページの上に出す案内 */
export function SuspendedNotice({ slug }: { slug: string }) {
  const suspended = useSuspended(slug);
  if (!suspended) return null;
  return (
    <p role="status" className="mb-4 border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-900">
      このプロジェクトは、運営の確認のため掲載を停止しています。新しい支援は受け付けていません。すでに支援した方には、マイページのメッセージでお知らせします。
    </p>
  );
}

/** 一覧のカードに重ねる「掲載停止中」の帯（停止中のページに知らずに進まないように） */
export function SuspendedCardBadge({ slug }: { slug: string }) {
  const suspended = useSuspended(slug);
  if (!suspended) return null;
  return <span className="absolute inset-x-0 bottom-0 bg-rose-700 px-2 py-1 text-center text-xs font-bold tracking-wider text-white">掲載停止中・支援の受付を止めています</span>;
}
