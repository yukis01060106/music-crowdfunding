import type { QueueItem } from "./review-queue";

// 運営画面のモック。本番では Supabase（ユーザー・問い合わせ・通報）と Stripe（決済・返金・振込）から取得する。
// TODO（本番）:
// - 運営ロールのユーザーだけが読めるよう、データを取得する関数の中で毎回認可してから返す
// - admin 配下は動的に描画する（export const dynamic = "force-dynamic" か cookies() を使う）。
//   ビルド時に事前描画すると、メールアドレスや返金の理由が HTML に埋め込まれて公開されてしまう。GitHub Pages の書き出しには本物のデータを通さない
// - 検索とページ送りはサーバーで行い、表示に必要な列だけを返す（メールアドレスは一部を伏せ、必要なときに「表示」の操作で取得する）
// - 運営の操作（個人情報の閲覧・検索、利用停止、本人確認の承認、返金・お断り、掲載の停止、返信）は、
//   admin_audit_logs（操作者 ID・操作・対象 ID・理由・日時・IP）に追記だけできる形で残す。閲覧の記録はサーバーのデータ取得の中で書く
// - 本人に送るメールはテンプレートでエスケープし、件名の改行を取り除く。返信と停止の理由には文字数の上限を設ける

/** 審査待ちのプロジェクト。2件目は表現チェックに引っかかる例 */
export const REVIEW_QUEUE: QueueItem[] = [
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
    rewards: ["0円 応援する", "¥1,000 入場チケット"],
    flags: { identity: true, cover: false, minor: true },
  },
];

/** 終了したプロジェクトの振込（モック）。募集中のものは、画面で集まった額から見込みを出す */
export interface PayoutRecord {
  id: string;
  title: string;
  artist: string;
  raised: number;
  endedAt: string;
  scheduledAt: string;
  status: "scheduled" | "paid" | "on_hold";
  /** 振込済みのとき、実際に振り込んだ日 */
  paidAt?: string;
  note?: string;
}

export const FINISHED_PAYOUTS: PayoutRecord[] = [
  { id: "po-1", title: "1st EP『夜行バス』の制作", artist: "ナツメグ", raised: 842000, endedAt: "2026-09-20", scheduledAt: "2026-10-04", status: "paid", paidAt: "2026-10-04" },
  { id: "po-2", title: "地元でワンマンライブを開きたい", artist: "the morning call", raised: 516000, endedAt: "2026-09-30", scheduledAt: "2026-10-14", status: "scheduled" },
  { id: "po-3", title: "アナログ盤を100枚だけプレスしたい", artist: "Lo-Fi Kitchen", raised: 388000, endedAt: "2026-10-02", scheduledAt: "2026-10-16", status: "on_hold", note: "振込先口座の名義が本人確認の名義と違うため、確認中" },
];

/**
 * 返金の申し出（モック）。返金できるのは、二重決済などの誤り、実行者の都合による中止・内容の変更（利用規約 第7条）、
 * 法令に基づく場合だけ。支援者の都合による取り消しはお受けしない（第5条）
 */
export interface RefundRequest {
  id: string;
  user: string;
  project: string;
  amount: number;
  requestedAt: string;
  reason: string;
  /** 申し出の種類。画面で判断の目安を出すのに使う */
  cause: "duplicate" | "creator" | "supporter";
  /** 決済の状態。All-in は支援の時点で決済済み */
  paymentState: "charged" | "paid_out" | "uncharged";
  /** 実行者の同意（実行者の都合による返金のとき） */
  creatorConsent?: boolean;
}

export const REFUND_REQUESTS: RefundRequest[] = [
  {
    id: "rf-1",
    user: "mika",
    project: "青木みお トリオ ライブ盤をアナログレコードで",
    amount: 5500,
    requestedAt: "2026-10-08",
    reason: "1回しか支援していないのに、同じ金額で2件請求されています。",
    cause: "duplicate",
    paymentState: "charged",
  },
  {
    id: "rf-2",
    user: "kenta",
    project: "軽音部SUNNY SIDE、卒業前に初めてのCDを作りたい",
    amount: 3000,
    requestedAt: "2026-10-09",
    reason: "卒業ライブの日に予定が入ってしまい、行けなくなりました。",
    cause: "supporter",
    paymentState: "charged",
  },
  {
    id: "rf-3",
    user: "radio_listener",
    project: "NEON KAIJU 初ワンマン、1000人で埋めたい",
    amount: 3500,
    requestedAt: "2026-10-10",
    reason: "活動報告で、会場の都合により公演日が変わると知りました。新しい日程は行けないため、返金を希望します。",
    cause: "creator",
    paymentState: "charged",
    creatorConsent: true,
  },
];

export const REFUND_CAUSE_LABELS: Record<RefundRequest["cause"], { label: string; hint: string }> = {
  duplicate: { label: "二重決済", hint: "同じ内容の決済が短い間に2件あるなど、誤りと確認できたら返金の対象です（2件の決済記録を確かめてください）。" },
  creator: { label: "実行者の都合", hint: "中止・内容の変更なので、実行者の同意を確かめてから返金します（規約 第7条）。" },
  supporter: { label: "支援者の都合", hint: "支援者の都合による取り消しは、原則お受けしていません（規約 第5条）。" },
};

export const REFUND_DECLINE_TEMPLATES = [
  "利用規約 第5条のとおり、決済が完了した支援は、支援者の都合による取り消しをお受けしていません。ご了承ください。",
  "実行者に確認したところ、リターンは予定どおりお届けします。そのため返金の対象にはなりません。",
];

/** 決済の失敗（モック）。All-or-Nothing の後からの請求や、メンバーシップの更新で起きる */
export interface PaymentFailure {
  id: string;
  user: string;
  kind: "all_or_nothing" | "membership";
  target: string;
  amount: number;
  failedAt: string;
  reason: string;
  retries: number;
}

export const PAYMENT_FAILURES: PaymentFailure[] = [
  { id: "pf-1", user: "haru", kind: "membership", target: "星空ラジオ メンバーシップ（クルー）", amount: 1000, failedAt: "2026-10-07", reason: "カードの有効期限切れ", retries: 1 },
  { id: "pf-2", user: "tsubasa", kind: "all_or_nothing", target: "1st EP『夜行バス』の制作", amount: 3000, failedAt: "2026-09-21", reason: "残高不足", retries: 3 },
];

/** ユーザー（モック） */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "supporter" | "creator";
  verified: boolean;
  joinedAt: string;
  backed: number;
  status: "active" | "suspended";
}

export const USERS: AdminUser[] = [
  { id: "u-1", name: "ゆう", email: "yu@example.com", role: "supporter", verified: false, joinedAt: "2026-03-02", backed: 18500, status: "active" },
  { id: "u-2", name: "星空ラジオ", email: "hoshizora@example.com", role: "creator", verified: true, joinedAt: "2025-11-20", backed: 0, status: "active" },
  { id: "u-3", name: "radio_listener", email: "listener@example.com", role: "supporter", verified: false, joinedAt: "2026-05-14", backed: 4000, status: "active" },
  { id: "u-4", name: "しおからP", email: "shiokara@example.com", role: "creator", verified: false, joinedAt: "2026-09-20", backed: 0, status: "active" },
  { id: "u-5", name: "mika", email: "mika@example.com", role: "supporter", verified: false, joinedAt: "2026-06-30", backed: 12000, status: "active" },
  { id: "u-6", name: "spam_account_01", email: "promo@example.net", role: "supporter", verified: false, joinedAt: "2026-10-05", backed: 0, status: "suspended" },
  { id: "u-7", name: "青木みお", email: "mio@example.com", role: "creator", verified: true, joinedAt: "2026-01-08", backed: 3000, status: "active" },
  { id: "u-8", name: "ナツメグ", email: "nutmeg@example.com", role: "creator", verified: true, joinedAt: "2026-04-11", backed: 0, status: "active" },
];

/** お問い合わせと通報（モック） */
export interface InboxItem {
  id: string;
  kind: "inquiry" | "report";
  from: string;
  subject: string;
  body: string;
  target?: string;
  /** 対象が公開中のプロジェクトなら、その slug（運営画面から掲載を停止できる） */
  targetSlug?: string;
  receivedAt: string;
  status: "open" | "in_progress" | "done";
}

export const INBOX: InboxItem[] = [
  { id: "in-1", kind: "inquiry", from: "ゆう", subject: "リターンが届きません", body: "お届け予定（9月末）を過ぎても CD が届きません。活動報告も止まっています。", target: "1st EP『夜行バス』の制作", receivedAt: "2026-10-09T10:12:00+09:00", status: "open" },
  { id: "in-2", kind: "report", from: "haru", subject: "無断転載の写真が使われている", body: "このプロジェクトの写真の1枚が、別のバンドの公式写真に似ています。確認してもらえますか。", target: "NEON KAIJU 初ワンマン、1000人で埋めたい", targetSlug: "neon-kaiju-1000", receivedAt: "2026-10-08T22:40:00+09:00", status: "in_progress" },
  { id: "in-3", kind: "inquiry", from: "the morning call", subject: "振込日を確認したい", body: "募集が9月30日に終わりました。振込はいつになりますか。", receivedAt: "2026-10-07T15:03:00+09:00", status: "done" },
  { id: "in-4", kind: "report", from: "mika", subject: "コメント欄の宣伝", body: "応援コメントに、関係のないサイトの宣伝が書き込まれています。", target: "ミルクティー☆シンドローム 初の東名阪ツアーに行きたい", targetSlug: "milktea-first-tour", receivedAt: "2026-10-09T08:20:00+09:00", status: "open" },
];

export const INBOX_REPLY_TEMPLATES = [
  "お問い合わせありがとうございます。実行者に状況を確認しています。わかりしだい、2営業日以内にご連絡します。",
  "ご報告ありがとうございます。内容を確認し、必要に応じて掲載の停止などの対応を行います。",
  "振込は募集終了から約14日後です。登録口座の名義に誤りがないかもご確認ください。",
];

/** 手数料収入の月ごとの推移（税別・モック）。FES の積み立ての試算に使う */
export const MONTHLY_FEES: { month: string; fee: number }[] = [
  { month: "2026-05", fee: 182000 },
  { month: "2026-06", fee: 264000 },
  { month: "2026-07", fee: 311000 },
  { month: "2026-08", fee: 402000 },
  { month: "2026-09", fee: 538000 },
  { month: "2026-10", fee: 221000 },
];
