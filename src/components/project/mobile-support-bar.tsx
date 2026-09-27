import Link from "next/link";
import type { Project } from "@/types";
import { formatNumber, progressPercent } from "@/lib/format";
import { DaysLeft } from "./days-left";

/** スマホで常に画面下に出す支援ボタン。長い本文を読んでいる途中でも支援できるように */
export function MobileSupportBar({ project }: { project: Project }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="text-xs leading-tight text-stone-600">
          <p>
            <span className="text-base font-bold text-brand">{progressPercent(project)}%</span> 達成
          </p>
          <p>
            {formatNumber(project.backers)}人・残り <DaysLeft endAt={project.endAt} />
          </p>
        </div>
        <Link
          href={`/projects/${project.slug}/support`}
          className="flex-1 rounded-full bg-brand py-3 text-center font-bold text-white"
        >
          支援する
        </Link>
      </div>
    </div>
  );
}
