"use client";

import type { Project } from "@/types";
import { formatNumber, progressPercent } from "@/lib/format";
import { DaysLeft } from "./days-left";
import { SupportCta, useOpenForSupport } from "./support-cta";
import { buttonClass } from "@/components/ui/button";

/** スマホで常に画面下に出す支援ボタン。長い本文を読んでいる途中でも支援できるように */
export function MobileSupportBar({ project }: { project: Project }) {
  // 募集が終わったら、押せないボタンで画面をふさがないよう出さない
  const open = useOpenForSupport(project);
  if (!open) return null;
  return (
    <div data-mobile-support-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="text-xs leading-tight text-stone-600">
          <p>
            <span className="text-base font-bold text-brand">{progressPercent(project)}%</span> 達成
          </p>
          <p>
            {formatNumber(project.backers)}人・残り <DaysLeft endAt={project.endAt} />
          </p>
        </div>
        <SupportCta project={project} className={buttonClass("primary", "md", "flex-1")}>
          リターンを選んで支援する
        </SupportCta>
      </div>
    </div>
  );
}
