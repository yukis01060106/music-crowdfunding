import type { RewardKind } from "@/types";

/**
 * リターンの事例。「はじめる」ページで紹介し、プロジェクトの作成画面ではワンクリックで下書きに入れられる。
 * 金額は目安。実行者が自分の活動の規模に合わせて変える前提。
 */
export interface RewardIdea {
  id: string;
  title: string;
  /** 作成画面に入れる説明のたたき台 */
  description: string;
  /** 「はじめる」ページに出す、ひとことの説明 */
  pitch: string;
  kind: RewardKind;
  price: number;
  /** 数量限定のおすすめ。なければ無制限 */
  limit?: number;
  /** 数量の単位（枚・名・点など） */
  unit?: string;
  requiresShipping: boolean;
  note?: string;
}

export const REWARD_IDEAS: RewardIdea[] = [
  {
    id: "digital",
    title: "音源の先行配信",
    description: "完成した音源を、一般公開より先にダウンロードでお届けします（全◯曲 ← 曲数を書いてください）。",
    pitch: "選ばれやすい入り口。配送がいらず、手間もかかりません。",
    kind: "digital",
    price: 1500,
    requiresShipping: false,
  },
  {
    id: "signed-cd",
    title: "サイン入りCD",
    description: "完成したCDに、メンバーのサインを入れてお届けします（全◯曲 ← 曲数を書いてください）。",
    pitch: "形に残る定番。音源の先行配信とセットにすると喜ばれます。",
    kind: "physical",
    price: 3000,
    requiresShipping: true,
  },
  {
    id: "cheki",
    title: "サイン入りチェキ",
    description: "このプロジェクトのために撮り下ろしたチェキに、サインとひとことを書いてお届けします。",
    pitch: "1枚ずつ手書きなので、枚数を決めて限定にするのがおすすめ。",
    kind: "physical",
    price: 3000,
    limit: 100,
    unit: "枚",
    requiresShipping: true,
    note: "写真は選べません。お名前の書き方は、支援のあとにメッセージでうかがいます。",
  },
  {
    id: "video-message",
    title: "あなたへの動画メッセージ",
    description: "お名前を呼んで、1分ほどの動画メッセージをお届けします（お届けの方法は活動報告でお知らせします）。",
    pitch: "配送がいらず、遠くに住むファンにも届く特別なリターン。",
    kind: "digital",
    price: 5000,
    limit: 50,
    unit: "名",
    requiresShipping: false,
    note: "お名前の読み方とメッセージの希望は、支援のあとにうかがいます。",
  },
  {
    id: "concert-seat",
    title: "ライブの前方エリアのチケット",
    description: "レコ発ライブの前方エリアに入れるチケットです。公演の2週間前に、QRコードのチケットをメールとマイページでお届けします。",
    pitch: "ライブとつなげると、支援が「会いに行く理由」になります。",
    kind: "ticket",
    price: 6000,
    limit: 30,
    unit: "名",
    requiresShipping: false,
    note: "会場・開演時間は決まりしだい活動報告でお知らせします。転売はできません。",
  },
  {
    id: "credit",
    title: "CD・MVのクレジットにお名前を掲載",
    description: "ブックレットとMVのエンドロールに、スペシャルサンクスとしてお名前を掲載します。",
    pitch: "作品の一部になれる、音楽ならではのリターン。",
    kind: "credit",
    price: 10000,
    requiresShipping: false,
    note: "掲載するお名前（ニックネーム可）は、支援のあとにうかがいます。",
  },
  {
    id: "lyrics-draft",
    title: "レコーディングで使った手書きの歌詞の草案",
    description: "実際のレコーディングで使った、書き込み入りの手書きの歌詞の草案（原本）をお届けします。",
    pitch: "世界に1枚だけ。少数限定の、特に熱心なファンに向けたリターン。",
    kind: "physical",
    price: 30000,
    limit: 1,
    unit: "点",
    requiresShipping: true,
    note: "原本のため1点限りです。汚れや折り目も含めて、そのままお届けします。",
  },
  {
    id: "studio-visit",
    title: "レコーディング見学",
    description: "スタジオでのレコーディングを、1日見学していただけます。",
    pitch: "制作の現場に立ち会える、少人数限定の体験。",
    kind: "experience",
    price: 30000,
    limit: 3,
    unit: "名",
    requiresShipping: false,
    note: "日程は相談して決めます。スタジオまでの交通費はご負担ください。",
  },
];
