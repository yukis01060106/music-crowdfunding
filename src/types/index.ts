// ドメイン型。金額はすべて「円」の整数で扱う。

export type Genre =
  | "rock"
  | "pop"
  | "hiphop"
  | "jazz"
  | "classical"
  | "electronic"
  | "idol"
  | "anime"
  | "indie";

/** 達成方式。All-or-Nothing は目標未達なら決済しない。All-in は未達でも実行する。 */
export type FundingModel = "all_or_nothing" | "all_in";

/** 目標の種類。金額目標のほか、muevo のような「参加人数」目標にも対応する。 */
export type GoalType = "amount" | "participants";

export type ProjectStatus =
  | "draft" // 作成中
  | "in_review" // 審査中（編集不可）
  | "approved" // 審査通過・公開待ち（実行者が公開ボタンを押す）
  | "live" // 募集中
  | "succeeded"
  | "failed";

/** 音楽特化のリターン種別 */
export type RewardKind =
  | "free" // 0円プラン（応援・参加表明）
  | "digital" // 音源の先行配信など。支払い完了後に自動配信
  | "physical" // CD・レコード・グッズ。配送先が必要
  | "ticket" // ライブチケット（QR）
  | "experience" // レコーディング見学など
  | "credit"; // クレジット掲載

export interface Artist {
  id: string;
  name: string;
  bio: string;
  genres: Genre[];
  links: { label: string; url: string }[];
  /** カバーのグラデーション（画像を用意するまでの代替） */
  color: string;
}

export interface Track {
  title: string;
  durationSec: number;
  /** 試聴用音源の URL。未設定なら「試聴準備中」 */
  previewUrl?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  price: number;
  kind: RewardKind;
  /** 在庫。undefined なら無制限 */
  limit?: number;
  backers: number;
  /** お届け予定（例: "2027年1月"） */
  deliveryEstimate: string;
  requiresShipping: boolean;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  /** true なら支援者だけが読める */
  backersOnly: boolean;
}

export interface SupportComment {
  id: string;
  userName: string;
  body: string;
  amount: number;
  createdAt: string;
}

export interface Project {
  slug: string;
  title: string;
  catchcopy: string;
  artistId: string;
  genre: Genre;
  status: ProjectStatus;
  fundingModel: FundingModel;
  goalType: GoalType;
  /** goalType が amount なら円、participants なら人数 */
  goal: number;
  raised: number;
  backers: number;
  startAt: string;
  endAt: string;
  story: string[];
  tracks: Track[];
  rewards: Reward[];
  updates: ProjectUpdate[];
  comments: SupportComment[];
  color: string;
}

export const GENRE_LABELS: Record<Genre, string> = {
  rock: "ロック",
  pop: "ポップス",
  hiphop: "ヒップホップ",
  jazz: "ジャズ",
  classical: "クラシック",
  electronic: "エレクトロニック",
  idol: "アイドル",
  anime: "アニソン・ゲーム音楽",
  indie: "インディーズ",
};

export const REWARD_KIND_LABELS: Record<RewardKind, string> = {
  free: "0円応援",
  digital: "デジタル音源",
  physical: "CD・グッズ",
  ticket: "ライブチケット",
  experience: "体験",
  credit: "クレジット掲載",
};

export const FUNDING_MODEL_LABELS: Record<FundingModel, string> = {
  all_or_nothing: "All-or-Nothing（目標達成時のみ実行）",
  all_in: "All-in（達成しなくても実行）",
};
