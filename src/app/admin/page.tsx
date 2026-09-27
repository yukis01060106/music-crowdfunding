import { PageTitle } from "@/components/side-nav";

// モック: 審査待ちのプロジェクト
const queue = [
  { id: "q1", title: "地元の商店街で野外フェスを開きたい", artist: "港町ブラス", submittedAt: "2026-09-25" },
  { id: "q2", title: "ボカロP 初のCDをコミケで頒布したい", artist: "しおからP", submittedAt: "2026-09-26" },
];

const checklist = ["本人確認が完了している", "リターンの実現性", "権利関係（カバー曲・映像）", "特定商取引法の表記"];

export default function AdminReviewPage() {
  return (
    <>
      <PageTitle>審査キュー</PageTitle>
      <p className="mb-4 text-sm text-stone-500">確認項目：{checklist.join(" / ")}</p>
      <ul className="space-y-3">
        {queue.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{q.title}</p>
              <p className="text-sm text-stone-500">
                {q.artist}・{q.submittedAt} 提出
              </p>
            </div>
            <button type="button" className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">差し戻す</button>
            <button type="button" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white">承認する</button>
          </li>
        ))}
      </ul>
    </>
  );
}
