"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatDate, formatDateTime, formatPrice, formatYen } from "@/lib/format";
import { markCharged, useDemo, type Backing } from "@/lib/demo-store";
import { chargeBacking, safeVoucherUrl, STRIPE_TEST } from "@/lib/payments";
import { toast } from "@/components/ui/toast";
import { useState } from "react";
import { useNow } from "@/lib/use-now";
import { Photo } from "@/components/ui/photo";
import { Avatar } from "@/components/account-button";
import { buttonClass } from "@/components/ui/button";

/** 領収書を別ウィンドウで開いて印刷する。宛名はその場で入力してもらう */
function openReceipt(b: Backing & { project: Project; rewardTitle: string; rewardPrice: number }, defaultName: string) {
  const name = window.prompt("領収書の宛名を入力してください", defaultName);
  if (name === null) return;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
  // TODO: 決済会社の取引IDを領収書番号にし、PDFはサーバーで作る
  // TODO（法務の確認）: リターンの販売者は実行者なので、発行者を実行者名義にするか、運営が代理で受け取った形にするかを決める
  w.document.write(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>領収書</title>
<style>body{font-family:sans-serif;max-width:600px;margin:48px auto;padding:0 24px;color:#222}h1{text-align:center;letter-spacing:.5em;border-bottom:2px solid #222;padding-bottom:12px}
.name{font-size:20px;border-bottom:1px solid #222;display:inline-block;min-width:60%;margin-top:32px}.amount{font-size:32px;font-weight:900;text-align:center;border:2px solid #222;padding:16px;margin:32px 0}
dl{display:grid;grid-template-columns:8em 1fr;gap:8px;font-size:14px}.issuer{margin-top:48px;text-align:right;font-size:14px;line-height:1.8}button{margin-top:32px}@media print{button{display:none}}</style></head>
<body><h1>領収書</h1><p class="name">${esc(name)} 様</p><p class="amount">${esc(formatYen(b.amount))}（税込）</p>
<p>但し、${esc(b.rewardTitle)}${b.quantity > 1 ? ` ×${b.quantity}` : ""}${b.tip > 0 ? "（上乗せ支援を含む）" : ""}の代金として、上記正に領収いたしました。</p>
<dl><dt>内訳</dt><dd>リターン ${esc(formatYen(b.rewardPrice * b.quantity))}${b.tip > 0 ? ` ／ 上乗せ支援 ${esc(formatYen(b.tip))}` : ""}</dd><dt>領収書番号</dt><dd>OTO-${esc(b.id.toUpperCase())}</dd><dt>支援日</dt><dd>${esc(formatDate(b.backedAt))}</dd><dt>プロジェクト</dt><dd>${esc(b.project.title)}</dd><dt>お支払い方法</dt><dd>${esc(b.paymentMethod)}</dd></dl>
<p class="issuer">〔運営会社名〕<br>OTOFUND 運営事務局<br>〔登録番号 T0000000000000〕</p>
<button onclick="window.print()">印刷する</button></body></html>`);
  w.document.close();
}

/** コンビニ払いで、支払期限を過ぎたもの（Webhook がないので、画面で期限から判断する） */
const voucherExpired = (b: Backing, now: number | null) => Boolean(b.awaitingPayment && b.voucherExpiresAt && now !== null && now > Date.parse(b.voucherExpiresAt));

function paymentStatus(project: Project, b: Backing, now: number | null): { label: string; className: string } {
  // 0円の参加は請求がないので、決済の状況は出さない
  if (b.amount === 0) return { label: "参加済み（0円）", className: "bg-brand-soft text-brand" };
  // 目標に届かなかったプロジェクトは、Stripe で登録したカードにも請求しない
  if (project.status === "failed" && project.fundingModel === "all_or_nothing") return { label: "決済なし（目標未達）", className: "bg-stone-100 text-stone-600" };
  // Stripe で決済したものは、実際の状態を出す
  if (voucherExpired(b, now)) return { label: "お支払い期限切れ（無効）", className: "bg-stone-100 text-stone-600" };
  if (b.awaitingPayment) return { label: "お支払い待ち（コンビニ）", className: "bg-amber-100 text-amber-800" };
  if (b.stripeSessionId && b.charged === true) return { label: "決済済み", className: "bg-emerald-100 text-emerald-700" };
  if (b.stripeSessionId && b.charged === false) return { label: "決済予定（目標達成後）", className: "bg-amber-100 text-amber-800" };
  if (project.fundingModel === "all_in") return { label: "決済済み", className: "bg-emerald-100 text-emerald-700" };
  if (project.status === "succeeded") return { label: "決済済み（目標達成）", className: "bg-emerald-100 text-emerald-700" };
  if (project.status === "failed") return { label: "決済なし（目標未達）", className: "bg-stone-100 text-stone-600" };
  return { label: "決済予定（目標達成後）", className: "bg-amber-100 text-amber-800" };
}

export function Backings({ projects }: { projects: Project[] }) {
  const { user, backings, memberships, favorites } = useDemo();
  const now = useNow();
  const rows = backings.flatMap((b: Backing) => {
    const project = projects.find((p) => p.slug === b.projectSlug);
    const reward = project?.rewards.find((r) => r.id === b.rewardId);
    return project && reward ? [{ ...b, project, reward }] : [];
  });
  // 期限切れで無効になったコンビニ払いは、合計に入れない
  const total = rows.reduce((sum, r) => sum + (voucherExpired(r, now) ? 0 : r.amount), 0);

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        {user && <Avatar name={user.name} size={56} />}
        <div>
          <p className="text-xs text-stone-500">おかえりなさい</p>
          <h1 className="text-2xl font-black tracking-[0.12em]">{user?.name}さん</h1>
        </div>
      </div>

      <div data-stagger className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="支援したプロジェクト" value={`${rows.length}件`} />
        <Kpi label="支援の合計" value={formatYen(total)} />
        <Kpi label="メンバーシップ" value={`${memberships.filter((m) => !m.canceledAt).length}件`} href="/mypage/membership" />
        <Kpi label="お気に入り" value={`${favorites.length}件`} href="/mypage/favorites" />
      </div>

      <h2 className="mb-4 font-bold">支援したプロジェクト</h2>
      {rows.length === 0 ? (
        <div className="border-2 border-dashed border-stone-300 p-10 text-center">
          <p className="text-stone-500">まだ支援したプロジェクトはありません。</p>
          <Link href="/projects" className={buttonClass("primary", "md", "mt-4")}>
            プロジェクトをさがす
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const status = paymentStatus(r.project, r, now);
            return (
              <li key={r.id} className="animate-rise flex flex-col gap-4 border border-stone-200 bg-white p-4 sm:flex-row">
                <Link href={`/projects/${r.project.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:h-24 sm:w-32">
                  <Photo src={r.project.cover} alt="" sizes="128px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-[11px] font-bold ${status.className}`}>{status.label}</span>
                    <span className="text-xs text-stone-500">{formatDate(r.backedAt)}に支援</span>
                  </div>
                  <Link href={`/projects/${r.project.slug}`} className="mt-1 line-clamp-1 font-bold hover:text-brand">
                    {r.project.title}
                  </Link>
                  <p className="text-sm text-stone-600">
                    {r.reward.title}
                    {r.quantity > 1 && ` × ${r.quantity}`}・{REWARD_KIND_LABELS[r.reward.kind]}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatPrice(r.amount)}
                    {r.tip > 0 && `（上乗せ ${formatYen(r.tip)} を含む）`}
                    {r.amount > 0 && `・${r.paymentMethod}`}・お届け予定 {r.reward.deliveryEstimate}
                    {r.awaitingPayment && r.voucherExpiresAt && !voucherExpired(r, now) && `・${formatDateTime(r.voucherExpiresAt)}までにお支払いください`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 self-start text-xs sm:flex-col">
                  <Link href={`/projects/${r.project.slug}/updates`} className="inline-flex min-h-11 items-center justify-center border border-stone-500 px-3 text-center hover:bg-stone-100">
                    活動報告
                  </Link>
                  <Link href={`/mypage/messages?to=${r.project.slug}`} className="inline-flex min-h-11 items-center justify-center border border-stone-500 px-3 text-center hover:bg-stone-100">
                    質問する
                  </Link>
                  {r.awaitingPayment && !voucherExpired(r, now) && safeVoucherUrl(r.voucherUrl) && (
                    <a href={safeVoucherUrl(r.voucherUrl)!} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center border border-amber-500 bg-amber-50 px-3 text-amber-900 hover:bg-amber-100">
                      払込票を開く
                    </a>
                  )}
                  {/* テストモードだけ。募集中か目標を達成したプロジェクトの、まだ請求していない支援に出す */}
                  {STRIPE_TEST && r.stripeSessionId && r.charged === false && r.project.status !== "failed" && <ChargeButton sessionId={r.stripeSessionId} />}
                  {r.amount > 0 && status.label.startsWith("決済済み") && (
                    <button type="button" onClick={() => openReceipt({ ...r, rewardTitle: r.reward.title, rewardPrice: r.reward.price }, user?.name ?? "")} className="inline-flex min-h-11 items-center justify-center border border-stone-500 px-3 hover:bg-stone-100">
                      領収書
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Kpi({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-en text-xl font-black">{value}</p>
    </>
  );
  return href ? (
    <Link href={href} className="block bg-stone-50 p-4 transition hover:-translate-y-0.5 hover:bg-brand-soft">
      {body}
    </Link>
  ) : (
    <div className="bg-stone-50 p-4">{body}</div>
  );
}

/**
 * テストモードだけ：All-or-Nothing の支援を「目標を達成した」として、登録済みのカードに請求する。
 * 本番では募集終了時にサーバーがまとめて請求する。
 */
function ChargeButton({ sessionId }: { sessionId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        chargeBacking(sessionId)
          .then((r) => {
            if (r.charged) {
              markCharged(sessionId);
              toast("（テスト）目標達成として請求しました");
            } else toast(r.status === "requires_action" ? "カードの本人認証が必要なため、請求を完了できませんでした" : "請求を処理しています。しばらくしてから確認してください");
          })
          .catch((e: Error) => toast(e.message))
          .finally(() => setBusy(false));
      }}
      className="inline-flex min-h-11 items-center justify-center border border-amber-500 bg-amber-50 px-3 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
    >
      {busy ? "請求しています…" : "（テスト）目標達成として請求"}
    </button>
  );
}
