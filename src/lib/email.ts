/**
 * メールの送信（サーバー専用）。RESEND_API_KEY と EMAIL_FROM があれば Resend で送り、なければ送らずにログだけ残す。
 * 本文はテキストだけにして、ユーザーが入力した文字列を HTML として扱わない（なりすましのリンクを作らせない）。
 * TODO（本番）: 送信の結果を email_logs に残し、失敗したら再送の待ち行列に入れる
 */
if (typeof window !== "undefined") throw new Error("email はサーバー専用です");

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

const MAX_SUBJECT = 120;
const MAX_TEXT = 8000;

/** 件名の改行を取り除く（ヘッダーの差し込みを防ぐ）。長すぎる本文は切る */
function clean(mail: Mail): Mail {
  return { to: mail.to.trim(), subject: mail.subject.replace(/[\r\n]+/g, " ").slice(0, MAX_SUBJECT), text: mail.text.slice(0, MAX_TEXT) };
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function sendEmail(input: Mail): Promise<{ sent: boolean; reason?: string }> {
  const mail = clean(input);
  if (!isEmail(mail.to)) return { sent: false, reason: "invalid address" };
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    // 開発中・デモでは送らない（だれに何を送るはずだったかだけ残す。本文や宛先の全文は残さない）
    console.info("[email] skipped (not configured):", mail.subject);
    return { sent: false, reason: "not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[email] failed:", res.status);
      return { sent: false, reason: `status ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] error:", e instanceof Error ? e.name : e);
    return { sent: false, reason: "network" };
  }
}

/* ───── 文面（Oto Fund のトーン：やさしく、短く、約束しすぎない） ───── */

const FOOTER = "\n\n――\nOto Fund（オトファンド）\nこのメールは送信専用です。ご不明な点は、サイトのお問い合わせからご連絡ください。";
const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

const deadline = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export const mails = {
  supportCompleted: (p: { projectTitle: string; amount: number; charged: boolean }) => ({
    subject: `ご支援ありがとうございます：${p.projectTitle}`,
    text: p.charged
      ? `「${p.projectTitle}」へのご支援を受け付けました。\nお支払い金額：${yen(p.amount)}（税込・送料込み）\nお支払いは完了しています。\n\nリターンの内容とお届け予定は、マイページでいつでも確かめられます。${FOOTER}`
      : `「${p.projectTitle}」へのご支援を受け付けました。\nお支払い予定の金額：${yen(p.amount)}（税込・送料込み）\nAll-or-Nothing のプロジェクトのため、いまはカードを登録しただけです。目標を達成した場合だけ、募集の終了後に請求します。届かなかった場合は請求しません。\n\nリターンの内容とお届け予定は、マイページでいつでも確かめられます。${FOOTER}`,
  }),
  konbiniPending: (p: { projectTitle: string; amount: number; expiresAt?: string | null }) => ({
    subject: `コンビニでのお支払いをお待ちしています：${p.projectTitle}`,
    text: `「${p.projectTitle}」へのご支援を受け付けました。コンビニでのお支払い（${yen(p.amount)}）をお待ちしています。\n${deadline(p.expiresAt) ? `お支払いの期限：${deadline(p.expiresAt)}\n` : ""}払込票は、マイページの支援の一覧から開けます。期限を過ぎると、ご支援は無効になります。${FOOTER}`,
  }),
  konbiniPaid: (p: { projectTitle: string; amount: number }) => ({
    subject: `お支払いを確認しました：${p.projectTitle}`,
    text: `コンビニでのお支払い（${yen(p.amount)}）を確認しました。「${p.projectTitle}」へのご支援が確定しました。${FOOTER}`,
  }),
  konbiniExpired: (p: { projectTitle: string }) => ({
    subject: `お支払いの期限が過ぎました：${p.projectTitle}`,
    text: `「${p.projectTitle}」へのご支援は、コンビニでのお支払いの期限が過ぎたため無効になりました。請求は発生していません。\n募集が続いていれば、プロジェクトのページからもう一度支援できます。${FOOTER}`,
  }),
  aonCharged: (p: { projectTitle: string; amount: number }) => ({
    subject: `目標を達成しました：${p.projectTitle}`,
    text: `「${p.projectTitle}」は目標を達成しました。ご登録のカードに ${yen(p.amount)} を請求しました。\nお届けまでの様子は、プロジェクトの活動報告で確かめられます。${FOOTER}`,
  }),
  /** 後からの請求・メンバーシップの更新が失敗したとき。理由（本人の認証が必要か、カードの問題か）で文面を分ける */
  paymentFailed: (p: { what: string; amount: number; needsAuth: boolean; retries: boolean }) => ({
    subject: `お支払いができませんでした：${p.what}`,
    text: `「${p.what}」のお支払い（${yen(p.amount)}）ができませんでした。\n${
      p.needsAuth ? "カード会社による本人の確認（3Dセキュア）が必要でした。" : "カードの有効期限や、ご利用の枠をご確認ください。"
    }\n${p.retries ? "数日後に、もう一度請求します。" : "お手数ですが、サイトのお問い合わせからご連絡ください。お支払いの方法をご案内します。"}${FOOTER}`,
  }),
  refunded: (p: { amount: number; projectTitle?: string }) => ({
    subject: p.projectTitle ? `返金の手続きをしました：${p.projectTitle}` : "返金の手続きをしました",
    text: `${p.projectTitle ? `「${p.projectTitle}」へのご支援のうち、` : ""}${yen(p.amount)} の返金の手続きをしました。お支払い方法によって、反映まで数日かかることがあります。${FOOTER}`,
  }),
};
