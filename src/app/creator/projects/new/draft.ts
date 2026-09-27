import type { ArtistType, FundingModel, Genre, GoalType, RewardKind } from "@/types";
import { MINOR_ARTIST_TYPES } from "@/types";
import type { ProofreadField } from "@/lib/proofread";
import { toEmbedUrl } from "@/lib/video";

export { toEmbedUrl };

// プロジェクト作成画面の下書き。数値も入力途中の空欄を許すため文字列で持つ。
// TODO: Supabase に保存したら、画像・音源は Storage にアップロードして URL を持つ

export const TITLE_MAX = 40;
export const CATCHCOPY_MAX = 60;
export const STORY_MIN = 400;
export const DAYS_MIN = 7;
export const DAYS_MAX = 80;

/** メイン画像。CAMPFIRE と同じく最大5枚、3:2・横1200px以上を推奨 */
export const IMAGE_MAX_COUNT = 5;
export const IMAGE_MAX_MB = 10;
export const IMAGE_MIN_WIDTH = 1200;
export const IMAGE_RATIO = 3 / 2;

export const TRACK_MAX_COUNT = 5;
export const TRACK_MAX_SEC = 90;
export const TRACK_MAX_MB = 20;

export const REWARD_RECOMMENDED = { min: 3, max: 8 };

/** 選んだファイル。URL はブラウザ内だけで有効な一時 URL */
export interface DraftImage {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  sizeMb: number;
}

export type StoryBlockType = "heading" | "text" | "image" | "video";

export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  /** 見出し・本文。画像ではキャプション */
  text: string;
  /** 画像の一時 URL、または動画の URL */
  url?: string;
}

export interface DraftTrack {
  id: string;
  title: string;
  fileName: string;
  url: string;
  durationSec: number;
  sizeMb: number;
  /** カバー曲か。カバー曲は著作権の許諾が必要 */
  isCover: boolean;
  licensed: boolean;
}

export interface DraftReward {
  id: string;
  title: string;
  description: string;
  price: string;
  kind: RewardKind;
  /** 数量限定。空なら無制限 */
  limit: string;
  /** お届け予定（YYYY-MM） */
  deliveryMonth: string;
  requiresShipping: boolean;
  /** チケット・体験の有効期限や開催日（YYYY-MM-DD） */
  validUntil: string;
  /** 注意事項（サイズ、会場、年齢制限など） */
  note: string;
  image?: DraftImage;
}

export interface Draft {
  title: string;
  catchcopy: string;
  genre: Genre;
  fundingModel: FundingModel;
  goalType: GoalType;
  goal: string;
  days: string;
  artistTypes: ArtistType[];
  guardianConsent: boolean;
  images: DraftImage[];
  videoUrl: string;
  summary: string[];
  story: StoryBlock[];
  tracks: DraftTrack[];
  budget: { id: string; label: string; amount: string }[];
  schedule: { id: string; month: string; label: string }[];
  risks: string;
  faqs: { id: string; q: string; a: string }[];
  rewards: DraftReward[];
  identityVerified: boolean;
  bankRegistered: boolean;
}

export const newId = () => Math.random().toString(36).slice(2, 10);

export function emptyReward(kind: RewardKind = "digital"): DraftReward {
  return {
    id: newId(),
    title: "",
    description: "",
    price: kind === "free" ? "0" : "3000",
    kind,
    limit: "",
    deliveryMonth: "",
    requiresShipping: kind === "physical",
    validUntil: "",
    note: "",
  };
}

/** ストーリーの構成テンプレート。支援の決め手の1位は「想いへの共感」なので、なぜ今やるのかを中心に */
export const STORY_TEMPLATE: StoryBlock[] = [
  { id: "t1", type: "heading", text: "はじめに" },
  { id: "t2", type: "text", text: "" },
  { id: "t3", type: "heading", text: "なぜ、いまこのプロジェクトをやるのか" },
  { id: "t4", type: "text", text: "" },
  { id: "t5", type: "heading", text: "このプロジェクトで実現すること" },
  { id: "t6", type: "text", text: "" },
  { id: "t7", type: "heading", text: "メンバー紹介" },
  { id: "t8", type: "text", text: "" },
  { id: "t9", type: "heading", text: "最後に" },
  { id: "t10", type: "text", text: "" },
];

export const RISKS_TEMPLATE =
  "制作の都合により、リターンのお届けが予定より遅れる可能性があります。その場合は活動報告で理由と新しい予定をお知らせします。\n" +
  "ライブが中止・延期になった場合は、振替公演のご案内、またはリターン相当額のご返金で対応します。";

export const initialDraft: Draft = {
  title: "",
  catchcopy: "",
  genre: "rock",
  fundingModel: "all_or_nothing",
  goalType: "amount",
  goal: "",
  days: "30",
  artistTypes: [],
  guardianConsent: false,
  images: [],
  videoUrl: "",
  summary: [""],
  story: STORY_TEMPLATE,
  tracks: [],
  budget: [{ id: "b1", label: "", amount: "" }],
  schedule: [{ id: "s1", month: "", label: "" }],
  risks: "",
  faqs: [
    { id: "f1", q: "リターンはいつ届きますか？", a: "" },
    { id: "f2", q: "目標に届かなかった場合はどうなりますか？", a: "" },
  ],
  rewards: [{ ...emptyReward("free"), id: "r1", title: "0円で応援する" }, { ...emptyReward("digital"), id: "r2" }],
  identityVerified: false,
  bankRegistered: false,
};

export const toNumber = (v: string) => (v.trim() === "" ? NaN : Number(v));

export function storyText(d: Draft): string {
  return d.story
    .filter((b) => b.type === "text" || b.type === "heading")
    .map((b) => b.text)
    .join("");
}

export function budgetTotal(d: Draft): number {
  return d.budget.reduce((sum, b) => sum + (toNumber(b.amount) || 0), 0);
}

export type Tab = "基本情報" | "写真・動画" | "ストーリー" | "試聴音源" | "資金・スケジュール" | "リターン" | "リスク・FAQ" | "本人確認・振込先";

export const TABS: Tab[] = ["基本情報", "写真・動画", "ストーリー", "試聴音源", "資金・スケジュール", "リターン", "リスク・FAQ", "本人確認・振込先"];

export interface CheckItem {
  label: string;
  done: boolean;
  tab: Tab;
  /** false なら推奨（提出はできる） */
  required: boolean;
}

export function rewardProblems(r: DraftReward): string[] {
  const problems: string[] = [];
  if (!r.title.trim()) problems.push("リターン名");
  if (r.kind !== "free") {
    if (!(toNumber(r.price) > 0)) problems.push("金額");
    if (!r.description.trim()) problems.push("内容の説明");
    if (!r.deliveryMonth) problems.push("お届け予定");
  }
  if ((r.kind === "ticket" || r.kind === "experience") && !r.validUntil) problems.push("開催日・有効期限");
  return problems;
}

export function checklist(d: Draft): CheckItem[] {
  const needsGuardian = d.artistTypes.some((t) => MINOR_ARTIST_TYPES.includes(t));
  const goal = toNumber(d.goal);
  const days = toNumber(d.days);
  const paid = d.rewards.filter((r) => r.kind !== "free");
  const coversOk = d.tracks.every((t) => !t.isCover || t.licensed);
  const items: CheckItem[] = [
    { label: "タイトル", done: d.title.trim().length > 0 && d.title.length <= TITLE_MAX, tab: "基本情報", required: true },
    { label: "キャッチコピー", done: d.catchcopy.trim().length > 0 && d.catchcopy.length <= CATCHCOPY_MAX, tab: "基本情報", required: true },
    { label: "目標と期間", done: goal > 0 && days >= DAYS_MIN && days <= DAYS_MAX, tab: "基本情報", required: true },
    { label: "アーティストタイプ", done: d.artistTypes.length > 0, tab: "基本情報", required: true },
    ...(needsGuardian ? [{ label: "保護者の同意", done: d.guardianConsent, tab: "基本情報" as Tab, required: true }] : []),
    { label: "メイン画像（1枚以上）", done: d.images.length > 0, tab: "写真・動画", required: true },
    { label: "メイン画像を3枚以上", done: d.images.length >= 3, tab: "写真・動画", required: false },
    { label: "紹介動画", done: toEmbedUrl(d.videoUrl) !== null, tab: "写真・動画", required: false },
    { label: "実現すること（要約）", done: d.summary.some((s) => s.trim()), tab: "ストーリー", required: true },
    { label: `ストーリー（${STORY_MIN}文字以上）`, done: storyText(d).length >= STORY_MIN, tab: "ストーリー", required: true },
    { label: "試聴音源", done: d.tracks.length > 0, tab: "試聴音源", required: false },
    { label: "カバー曲の許諾", done: coversOk, tab: "試聴音源", required: true },
    { label: "資金の使い道", done: d.budget.some((b) => b.label.trim() && toNumber(b.amount) > 0), tab: "資金・スケジュール", required: true },
    { label: "スケジュール（2つ以上）", done: d.schedule.filter((s) => s.month && s.label.trim()).length >= 2, tab: "資金・スケジュール", required: true },
    { label: "有料のリターン", done: paid.length > 0, tab: "リターン", required: true },
    { label: "リターンの詳細（説明・お届け予定など）", done: d.rewards.every((r) => rewardProblems(r).length === 0), tab: "リターン", required: true },
    {
      label: `リターンを${REWARD_RECOMMENDED.min}種類以上`,
      done: d.rewards.length >= REWARD_RECOMMENDED.min,
      tab: "リターン",
      required: false,
    },
    { label: "リスクとチャレンジ", done: d.risks.trim().length > 0, tab: "リスク・FAQ", required: true },
    { label: "よくある質問", done: d.faqs.some((f) => f.q.trim() && f.a.trim()), tab: "リスク・FAQ", required: false },
    { label: "本人確認", done: d.identityVerified, tab: "本人確認・振込先", required: true },
    { label: "振込先口座", done: d.bankRegistered, tab: "本人確認・振込先", required: true },
  ];
  return items;
}

/** 校正にかける文章をすべて集める。id は applyFix で書き戻す宛先 */
export function proofreadFields(d: Draft): ProofreadField[] {
  return [
    { id: "title", label: "タイトル", text: d.title },
    { id: "catchcopy", label: "キャッチコピー", text: d.catchcopy },
    ...d.summary.map((s, i) => ({ id: `summary:${i}`, label: `実現すること ${i + 1}`, text: s })),
    ...d.story
      .filter((b) => b.type !== "video")
      .map((b) => ({ id: `story:${b.id}`, label: b.type === "heading" ? "ストーリーの見出し" : b.type === "image" ? "画像のキャプション" : "ストーリー本文", text: b.text })),
    ...d.budget.map((b) => ({ id: `budget:${b.id}`, label: "資金の使い道", text: b.label })),
    ...d.schedule.map((s) => ({ id: `schedule:${s.id}`, label: "スケジュール", text: s.label })),
    ...d.rewards.flatMap((r) => [
      { id: `reward:${r.id}:title`, label: `リターン「${r.title || "無題"}」の名前`, text: r.title },
      { id: `reward:${r.id}:description`, label: `リターン「${r.title || "無題"}」の説明`, text: r.description },
      { id: `reward:${r.id}:note`, label: `リターン「${r.title || "無題"}」の注意事項`, text: r.note },
    ]),
    { id: "risks", label: "リスクとチャレンジ", text: d.risks },
    ...d.faqs.flatMap((f) => [
      { id: `faq:${f.id}:q`, label: "よくある質問（質問）", text: f.q },
      { id: `faq:${f.id}:a`, label: "よくある質問（回答）", text: f.a },
    ]),
  ].filter((f) => f.text.trim());
}

/** 校正の修正案を下書きに反映する。最初に見つかった1か所だけ置き換える */
export function applyFix(d: Draft, fieldId: string, excerpt: string, replacement: string): Draft {
  const fix = (text: string) => text.replace(excerpt, replacement);
  const [kind, id, prop] = fieldId.split(":");
  switch (kind) {
    case "title":
      return { ...d, title: fix(d.title) };
    case "catchcopy":
      return { ...d, catchcopy: fix(d.catchcopy) };
    case "risks":
      return { ...d, risks: fix(d.risks) };
    case "summary":
      return { ...d, summary: d.summary.map((s, i) => (String(i) === id ? fix(s) : s)) };
    case "story":
      return { ...d, story: d.story.map((b) => (b.id === id ? { ...b, text: fix(b.text) } : b)) };
    case "budget":
      return { ...d, budget: d.budget.map((b) => (b.id === id ? { ...b, label: fix(b.label) } : b)) };
    case "schedule":
      return { ...d, schedule: d.schedule.map((s) => (s.id === id ? { ...s, label: fix(s.label) } : s)) };
    case "reward":
      return {
        ...d,
        rewards: d.rewards.map((r) => {
          if (r.id !== id || (prop !== "title" && prop !== "description" && prop !== "note")) return r;
          return { ...r, [prop]: fix(r[prop]) };
        }),
      };
    case "faq":
      return {
        ...d,
        faqs: d.faqs.map((f) => (f.id === id && (prop === "q" || prop === "a") ? { ...f, [prop]: fix(f[prop]) } : f)),
      };
    default:
      return d;
  }
}

const STORAGE_KEY = "otofund:project-draft";

/** 画像・音源の一時 URL はページを閉じると無効になるので、文章だけ保存する */
export function saveDraft(d: Draft): boolean {
  const textOnly: Draft = {
    ...d,
    images: [],
    tracks: [],
    story: d.story.map((b) => (b.type === "image" ? { ...b, url: undefined } : b)),
    rewards: d.rewards.map((r) => ({ ...r, image: undefined })),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialDraft, ...(JSON.parse(raw) as Partial<Draft>) } : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 保存できない環境では何もしない
  }
}
