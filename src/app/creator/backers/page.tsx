import { PageTitle } from "@/components/side-nav";
import { formatDate, formatYen } from "@/lib/format";

// モック。個人情報（住所など）は配送画面でのみ扱い、一覧には出さない
const backers = [
  { id: "b1", name: "ゆう", reward: "サイン入りCD＋先行配信", amount: 4_000, backedAt: "2026-09-03T12:10:00+09:00" },
  { id: "b2", name: "radio_listener", reward: "レコ発ワンマンの招待チケット", amount: 6_000, backedAt: "2026-09-10T22:41:00+09:00" },
  { id: "b3", name: "haru", reward: "アルバム音源を先行配信", amount: 2_500, backedAt: "2026-09-12T08:05:00+09:00" },
];

export default function BackersPage() {
  return (
    <>
      <PageTitle>支援者一覧</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button type="button" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5">CSVダウンロード</button>
        <button type="button" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5">全員にメッセージ</button>
        <button type="button" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5">リターンで絞り込んでメッセージ</button>
      </div>
      <div className="overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="p-3">支援者</th>
              <th className="p-3">リターン</th>
              <th className="p-3 text-right">金額</th>
              <th className="p-3">支援日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {backers.map((b) => (
              <tr key={b.id}>
                <td className="p-3 font-medium">{b.name}</td>
                <td className="p-3">{b.reward}</td>
                <td className="p-3 text-right">{formatYen(b.amount)}</td>
                <td className="p-3 text-stone-500">{formatDate(b.backedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
