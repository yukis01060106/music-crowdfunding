import { getArtists, getPublicProjects } from "@/lib/data";
import { formatNumber, formatYen } from "@/lib/format";
import { PLATFORM_FEE_RATE } from "@/lib/fees";
import { PageTitle } from "@/components/side-nav";
import { ReviewQueue, type QueueItem } from "./review-queue";

// モック: 審査待ちのプロジェクト。2件目は表現チェックに引っかかる例
const QUEUE: QueueItem[] = [
  {
    id: "q1",
    title: "地元の商店街で野外フェスを開きたい",
    artist: "港町ブラス",
    submittedAt: "2026-09-25",
    goal: "¥1,200,000",
    story: "結成10年の吹奏楽団です。コロナで中止になった商店街の夏祭りを、音楽フェスとして復活させたいと考えています。ステージの設営費と音響機材のレンタル費を募ります。",
    rewards: ["¥3,000 フェスの入場チケット", "¥10,000 前方エリアのチケット＋記念タオル", "¥50,000 ステージにお名前を掲示"],
    flags: { identity: true, cover: false, minor: false },
  },
  {
    id: "q2",
    title: "日本初！ボカロP 初のCDをコミケで頒布したい",
    artist: "しおからP",
    submittedAt: "2026-09-26",
    goal: "¥300,000",
    story: "絶対に後悔させません！投資していただいた方には、CDの売上から配当もお返しします。人気曲のカバーも収録予定です。",
    rewards: ["¥1,500 CD", "¥5,000 CD＋サイン色紙"],
    flags: { identity: false, cover: true, minor: false },
  },
  {
    id: "q3",
    title: "軽音部の定期演奏会をライブハウスで開きたい",
    artist: "県立北高校 軽音部",
    submittedAt: "2026-09-27",
    goal: "参加 100人",
    story: "3年生最後の定期演奏会を、はじめてライブハウスで開きます。会場費の一部を募ります。",
    rewards: ["¥0 応援する", "¥1,000 入場チケット"],
    flags: { identity: true, cover: false, minor: true },
  },
];

export default async function AdminPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  const gmv = projects.reduce((sum, p) => sum + p.raised, 0);
  const members = artists.reduce((sum, a) => sum + (a.membership?.plans.reduce((s, p) => s + p.members, 0) ?? 0), 0);
  const membershipMonthly = artists.reduce((sum, a) => sum + (a.membership?.plans.reduce((s, p) => s + p.price * p.members, 0) ?? 0), 0);

  return (
    <>
      <PageTitle>審査と運営状況</PageTitle>
      <div data-stagger className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="掲載中のプロジェクト" value={`${projects.filter((p) => p.status === "live").length}件`} />
        <Kpi label="累計の支援総額" value={formatYen(gmv)} />
        <Kpi label="手数料収入の見込み" value={formatYen(Math.floor(gmv * PLATFORM_FEE_RATE))} />
        <Kpi label="メンバーシップ" value={`${formatNumber(members)}人・${formatYen(membershipMonthly)}/月`} />
      </div>
      <ReviewQueue items={QUEUE} />
      <p className="mt-8 text-xs text-stone-500">手数料収入の一部は、ONE NOTE FES の開催費用にあてます。あてる割合は事業計画で決めます。</p>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-en text-lg font-black">{value}</p>
    </div>
  );
}
