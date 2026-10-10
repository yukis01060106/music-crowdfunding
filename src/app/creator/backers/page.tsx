import { getCreatorProjects } from "@/lib/data";
import { PageTitle } from "@/components/side-nav";
import { BackerTable, type BackerRow } from "./backer-table";

// モック。本番では支援のテーブルから取得する。
// マイページ・応援コメント・メッセージに出てくる支援者とは、リターンと内容を揃えている
const SAMPLE: (Omit<BackerRow, "id" | "reward" | "amount"> & { rewardId: string })[] = [
  { name: "ゆう", rewardId: "r-cd", backedAt: "2026-09-03T12:10:00+09:00", comment: "下北のライブで聴いた「周波数」がずっと忘れられません。音源になるのが楽しみです！" },
  { name: "radio_listener", rewardId: "r-ticket", backedAt: "2026-09-10T22:41:00+09:00", comment: "レコ発、絶対行きます。" },
  { name: "haru", rewardId: "r-digital", backedAt: "2026-09-12T08:05:00+09:00" },
  { name: "mika", rewardId: "r-cd", backedAt: "2026-09-14T19:22:00+09:00", comment: "夜の曲が好きです" },
  { name: "kenta", rewardId: "r-digital", backedAt: "2026-09-18T07:48:00+09:00" },
  { name: "のぞみ", rewardId: "r-credit", backedAt: "2026-09-21T23:10:00+09:00", comment: "高校生のころから聴いてます" },
  { name: "tsubasa", rewardId: "r-ticket", backedAt: "2026-09-24T12:00:00+09:00" },
];

export default async function BackersPage() {
  const [project] = await getCreatorProjects();
  const paid = project?.rewards.filter((r) => r.price > 0) ?? [];
  const rows: BackerRow[] = SAMPLE.map(({ rewardId, ...s }, i) => {
    const r = paid.find((x) => x.id === rewardId);
    return { ...s, id: `b${i}`, reward: r?.title ?? "", amount: r?.price ?? 0 };
  });

  return (
    <>
      <PageTitle>支援者一覧</PageTitle>
      {project && <p className="mb-4 text-sm text-stone-500">{project.title}</p>}
      <BackerTable rows={rows} rewards={paid.map((r) => r.title)} />
      <p className="mt-3 text-xs text-stone-500">お届け先の住所は、個人情報を守るため「リターン配送」の画面でのみ扱います。</p>
    </>
  );
}
