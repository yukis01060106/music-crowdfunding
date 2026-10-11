"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatDate, formatDateTime, formatPrice, formatYen } from "@/lib/format";
import { markCharged, own, useDemo, type Backing } from "@/lib/demo-store";
import { PAYMENT_LABELS, paymentState, useRefundedBackingIds, voucherExpired } from "@/lib/backing-state";
import { useAdmin } from "@/lib/admin-store";
import { chargeBacking, safeVoucherUrl, STRIPE_TEST } from "@/lib/payments";
import { toast } from "@/components/ui/toast";
import { useState } from "react";
import { useNow } from "@/lib/use-now";
import { Photo } from "@/components/ui/photo";
import { Avatar } from "@/components/account-button";
import { buttonClass } from "@/components/ui/button";
import { tagClass } from "@/components/ui/tag";
import { RefundRequestButton, RefundStatusTag } from "./refund-request";

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
<p class="issuer">〔運営会社名〕<br>Oto Fund 運営事務局<br>〔登録番号 T0000000000000〕</p>
<button onclick="window.print()">印刷する</button></body></html>`);
  w.document.close();
}

function paymentStatus(project: Project, b: Backing, now: number | null): { label: string; className: string } {
  const state = paymentState(project, b, now);
  // 目標を達成して請求した All-or-Nothing は、そのことがわかるように
  if (state === "charged" && project.fundingModel === "all_or_nothing" && project.status === "succeeded") return { ...PAYMENT_LABELS.charged, label: "決済済み（目標達成）" };
  return PAYMENT_LABELS[state];
}

/** 支援がいまどの段階か。0：支援済み 1：決済済み 2：制作中 3：発送・お届け済み */
function stageOf(project: Project, b: Backing, now: number | null, shipped: boolean): number {
  if (shipped) return 3;
  if (paymentState(project, b, now) !== "charged") return 0;
  // 決済が済んだら制作に入る（All-or-Nothing は募集が終わってから）
  return project.status === "live" && project.fundingModel === "all_or_nothing" ? 1 : 2;
}

function BackingProgress({ stage, delivery }: { stage: number; delivery: string }) {
  const labels = ["支援", "決済", "制作中", delivery];
  return (
    <ol className="mt-3 flex max-w-sm items-center gap-1" aria-label={`いまの段階：${labels[stage]}`}>
      {labels.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col gap-1">
          <span className={`h-1.5 ${i <= stage ? "bg-brand" : "bg-stone-200"}`} aria-hidden />
          <span className={`text-[11px] ${i === stage ? "font-bold text-brand" : i < stage ? "text-stone-600" : "text-stone-500"}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function Backings({ projects }: { projects: Project[] }) {
  const { user, backings, memberships, favorites, shipped, tracking, postedUpdates } = useDemo();
  // 実行者が7日以内に投稿した活動報告があるか
  const hasNewUpdate = (slug: string) => now !== null && postedUpdates.some((u) => u.projectSlug === slug && now - Date.parse(u.publishedAt) < 7 * 24 * 60 * 60 * 1000);
  // 運営が返金したもの（合計に入れない）
  const refunded = useRefundedBackingIds();
  const admin = useAdmin();
  const now = useNow();
  const rows = backings.flatMap((b: Backing) => {
    const project = projects.find((p) => p.slug === b.projectSlug);
    const reward = project?.rewards.find((r) => r.id === b.rewardId);
    return project && reward ? [{ ...b, project, reward }] : [];
  });
  // 期限切れで無効になったコンビニ払いは、合計に入れない
  const total = rows.reduce((sum, r) => sum + (voucherExpired(r, now) || refunded.has(r.id) ? 0 : r.amount), 0);

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
        <Kpi label="支援したプロジェクト" value={`${new Set(rows.map((r) => r.projectSlug)).size}件`} note={rows.length > new Set(rows.map((r) => r.projectSlug)).size ? `支援 ${rows.length}件` : undefined} />
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
              <li key={r.id} className="animate-rise flex flex-wrap gap-4 border-[3px] border-ink/10 bg-white p-4 sm:flex-nowrap">
                <Link href={`/projects/${r.project.slug}`} tabIndex={-1} aria-hidden className="relative size-20 shrink-0 overflow-hidden sm:h-24 sm:w-32">
                  <Photo src={r.project.cover} alt="" sizes="128px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!refunded.has(r.id) && <span className={`px-2 py-0.5 text-[11px] font-bold ${status.className}`}>{status.label}</span>}
                    {/* 実行者の画面で発送済みにしたもの */}
                    {own(shipped, r.id) && (
                      <span className={tagClass("success")}>
                        発送済み（{formatDate(own(shipped, r.id)!)}）{own(tracking, r.id) && `・追跡番号 ${own(tracking, r.id)}`}
                      </span>
                    )}
                    <RefundStatusTag backingId={r.id} />
                    {own(admin.suspendedProjects, r.project.slug) && <span className={tagClass("danger")}>掲載停止中</span>}
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
                  {/* いまどの段階か（支援 → 決済 → 制作中 → お届け） */}
                  {r.amount > 0 && !refunded.has(r.id) && <BackingProgress stage={stageOf(r.project, r, now, Boolean(own(shipped, r.id)))} delivery={r.reward.requiresShipping ? "発送" : "お届け"} />}
                </div>
                <div className="grid w-full shrink-0 grid-cols-2 gap-2 self-start text-xs sm:flex sm:w-44 sm:flex-col">
                  <Link href={`/projects/${r.project.slug}/updates`} className={buttonClass("secondary", "md", "text-xs")}>
                    活動報告
                    {hasNewUpdate(r.project.slug) && (
                      <span className={tagClass("brand", "ml-1")}>
                        新着<span className="sr-only">の活動報告があります</span>
                      </span>
                    )}
                  </Link>
                  <Link href={`/mypage/messages?to=${r.project.slug}`} className={buttonClass("secondary", "md", "text-xs")}>
                    質問する
                  </Link>
                  {r.awaitingPayment && !voucherExpired(r, now) && safeVoucherUrl(r.voucherUrl) && (
                    <a href={safeVoucherUrl(r.voucherUrl)!} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center border border-amber-500 bg-amber-50 px-3 text-amber-900 hover:bg-amber-100">
                      払込票を開く
                    </a>
                  )}
                  {/* テストモードだけ。募集中か目標を達成したプロジェクトの、まだ請求していない支援に出す */}
                  {STRIPE_TEST && r.stripeSessionId && r.charged === false && r.project.status !== "failed" && <ChargeButton sessionId={r.stripeSessionId} />}
                  {/* 返金の相談は、決済が済んだ支援だけ（請求前の All-or-Nothing や、支払い前のコンビニ払いは返金の対象にならない） */}
                  {paymentState(r.project, r, now) === "charged" && <RefundRequestButton backingId={r.id} projectSlug={r.project.slug} projectTitle={r.project.title} amount={r.amount} />}
                  {r.amount > 0 && status.label.startsWith("決済済み") && !refunded.has(r.id) && (
                    <button type="button" onClick={() => openReceipt({ ...r, rewardTitle: r.reward.title, rewardPrice: r.reward.price }, user?.name ?? "")} className={buttonClass("secondary", "md", "text-xs")}>
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

function Kpi({ label, value, href, note }: { label: string; value: string; href?: string; note?: string }) {
  const body = (
    <>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-en text-xl font-black">{value}</p>
      {note && <p className="text-xs text-stone-500">{note}</p>}
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
