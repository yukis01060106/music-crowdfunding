"use client";

import type { Project } from "@/types";
import { useOpenForSupport } from "./support-cta";

/** 支援ボタンのそばに出す、支援の不安を減らす短い3行。PC のサイドバーとスマホの支援状況で同じものを使う */
export function TrustLines({ project }: { project: Pick<Project, "fundingModel" | "rewards" | "status" | "endAt"> }) {
  // 募集が終わったら出さない（「届かなければお支払いなし」は、もう支援できない人には不要）
  const open = useOpenForSupport(project);
  if (!open) return null;
  return (
    <ul className="space-y-1 text-xs text-stone-600">
      <li>
        <span aria-hidden>✓ </span>
        {project.fundingModel === "all_or_nothing" ? "目標に届かなければ、お支払いはありません" : "支援した時点で決済されます"}
      </li>
      <li>
        <span aria-hidden>✓ </span>表示価格は税込・送料込み
      </li>
      {project.rewards.some((r) => r.price === 0) && (
        <li>
          <span aria-hidden>✓ </span>0円で参加できるプランもあります
        </li>
      )}
    </ul>
  );
}
