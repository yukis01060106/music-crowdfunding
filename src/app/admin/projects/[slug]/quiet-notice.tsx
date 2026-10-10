"use client";

import { useNow } from "@/lib/use-now";

const DAY_MS = 24 * 60 * 60 * 1000;
/** 活動報告がこの日数より空いたら、運営から声をかける目安 */
const QUIET_DAYS = 30;

/** 最後の活動報告から日がたっていたら知らせる（今日の日付はブラウザで決める） */
export function QuietNotice({ lastUpdate, startAt }: { lastUpdate?: string; startAt: string }) {
  const now = useNow();
  if (now === null) return null;
  // 報告がまだ1件もないときは、募集の開始から数える
  const days = Math.floor((now - Date.parse(lastUpdate ?? startAt)) / DAY_MS);
  if (days < QUIET_DAYS) return null;
  return (
    <p className="mt-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {lastUpdate ? `最後の活動報告から${days}日たっています。` : `募集の開始から${days}日たちましたが、活動報告がまだありません。`}
      支援者が不安にならないよう、実行者に近況の報告をお願いしましょう。
    </p>
  );
}
