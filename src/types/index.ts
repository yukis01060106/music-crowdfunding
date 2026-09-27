// ドメイン型。金額はすべて「円」の整数で扱う。

export type Genre =
  | "rock"
  | "pop"
  | "hiphop"
  | "jazz"
  | "classical"
  | "electronic"
  | "anime"
  | "vocaloid";

/**
 * アーティストタイプ。音楽ジャンルとは別の軸で、1組のアーティストが複数持てる
 * （例: 大学生 かつ YouTuber）。
 */
export type ArtistType =
  | "major"
  | "indie"
  | "youtuber"
  | "tiktoker"
  | "idol"
  | "underground_idol"
  | "university"
  | "high_school";

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
  types: ArtistType[];
  /** 運営による本人確認が済んでいるか。支援者の「信頼できる人か」という不安に応える */
  verified: boolean;
  links: { label: string; url: string }[];
  /** カバーのグラデーション（写真が読み込まれるまでの下地） */
  color: string;
  /** プロフィール写真（public/ からのパス） */
  photo: string;
  /** アーティストページの写真に縦書きで重ねる短いコピー（15文字程度まで） */
  catchline: string;
  /** 月額メンバーシップ。未開設なら undefined */
  membership?: Membership;
}

/** 月額メンバーシップのプラン。金額は税込の月額 */
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  perks: string[];
  members: number;
  /** 人数限定。undefined なら無制限 */
  limit?: number;
}

export interface Membership {
  /** 加入ページの冒頭に出す、アーティストからのひとこと */
  message: string;
  plans: MembershipPlan[];
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
  /** 冒頭に出す「このプロジェクトで実現すること」。スマホでは冒頭しか読まれないため3点以内 */
  summary: string[];
  story: string[];
  /** 資金の使い道 */
  budget: { label: string; amount: number }[];
  /** 今後のスケジュール */
  schedule: { date: string; label: string }[];
  /** リスクとチャレンジ（遅延や中止の可能性と、その場合の対応） */
  risks: string;
  faqs: { q: string; a: string }[];
  tracks: Track[];
  rewards: Reward[];
  updates: ProjectUpdate[];
  comments: SupportComment[];
  color: string;
  /** メインの写真（public/ からのパス）。一覧やシェアに使う表紙 */
  cover: string;
  /** 表紙に続けて見せる写真。表紙を含めて最大5枚 */
  gallery?: string[];
  /** 紹介動画（YouTube / Vimeo の URL） */
  videoUrl?: string;
}

export const GENRE_LABELS: Record<Genre, string> = {
  rock: "ロック",
  pop: "ポップス",
  hiphop: "ヒップホップ",
  jazz: "ジャズ",
  classical: "クラシック",
  electronic: "エレクトロニック",
  anime: "アニソン・ゲーム音楽",
  vocaloid: "ボカロ",
};

export const ARTIST_TYPE_LABELS: Record<ArtistType, string> = {
  major: "メジャーアーティスト",
  indie: "インディーズ",
  youtuber: "YouTuber",
  tiktoker: "TikToker",
  idol: "アイドル",
  underground_idol: "地下アイドル",
  university: "大学生",
  high_school: "高校生",
};

/** 未成年が多いタイプ。プロジェクト作成時に保護者の同意を求める */
export const MINOR_ARTIST_TYPES: readonly ArtistType[] = ["high_school"];

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
