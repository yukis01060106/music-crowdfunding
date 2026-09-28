"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { REWARD_KIND_LABELS } from "@/types";
import { formatDate, formatYen } from "@/lib/format";
import { useDemo, type Backing } from "@/lib/demo-store";
import { Photo } from "@/components/ui/photo";
import { Avatar } from "@/components/account-button";

/** 領収書を別ウィンドウで開いて印刷する。宛名はその場で入力してもらう */
function openReceipt(b: Backing & { project: Project }, defaultName: string) {
  const name = window.prompt("領収書の宛名を入力してください", defaultName);
  if (name === null) return;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
  // TODO: 決済会社の取引IDを領収書番号にし、PDFはサーバーで作る
  w.document.write(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>領収書</title>
<style>body{font-family:sans-serif;max-width:600px;margin:48px auto;padding:0 24px;color:#222}h1{text-align:center;letter-spacing:.5em;border-bottom:2px solid #222;padding-bottom:12px}
.name{font-size:20px;border-bottom:1px solid #222;display:inline-block;min-width:60%;margin-top:32px}.amount{font-size:32px;font-weight:900;text-align:center;border:2px solid #222;padding:16px;margin:32px 0}
dl{display:grid;grid-template-columns:8em 1fr;gap:8px;font-size:14px}.issuer{margin-top:48px;text-align:right;font-size:14px;line-height:1.8}button{margin-top:32px}@media print{button{display:none}}</style></head>
<body><h1>領収書</h1><p class="name">${esc(name)} 様</p><p class="amount">${esc(formatYen(b.amount))}（税込）</p>
<p>但し、クラウドファンディングの支援金として、上記正に領収いたしました。</p>
<dl><dt>領収書番号</dt><dd>OTO-${esc(b.id.toUpperCase())}</dd><dt>支援日</dt><dd>${esc(formatDate(b.backedAt))}</dd><dt>プロジェクト</dt><dd>${esc(b.project.title)}</dd><dt>お支払い方法</dt><dd>${esc(b.paymentMethod)}</dd></dl>
<p class="issuer">〔運営会社名〕<br>OTOFUND 運営事務局<br>〔登録番号 T0000000000000〕</p>
<button onclick="window.print()">印刷する</button></body></html>`);
  w.document.close();
}

function paymentStatus(project: Project): { label: string; className: string } {
  if (project.fundingModel === "all_in") return { label: "決済済み", className: "bg-emerald-100 text-emerald-700" };
  if (project.status === "succeeded") return { label: "決済済み（目標達成）", className: "bg-emerald-100 text-emerald-700" };
  if (project.status === "failed") return { label: "決済なし（目標未達）", className: "bg-stone-100 text-stone-600" };
  return { label: "決済予定（目標達成後）", className: "bg-amber-100 text-amber-800" };
}

export function Backings({ projects }: { projects: Project[] }) {
  const { user, backings, memberships, favorites } = useDemo();
  const rows = backings.flatMap((b: Backing) => {
    const project = projects.find((p) => p.slug === b.projectSlug);
    const reward = project?.rewards.find((r) => r.id === b.rewardId);
    return project && reward ? [{ ...b, project, reward }] : [];
  });
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        {user && <Avatar name={user.name} size={56} />}
        <div>
          <p className="text-xs text-stone-500">おかえりなさい</p>
          <h1 className="text-2xl font-bold">{user?.name}さん</h1>
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
          <Link href="/projects" className="mt-4 inline-block bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-brand">
            プロジェクトをさがす
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const status = paymentStatus(r.project);
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
                    {formatYen(r.amount)}
                    {r.tip > 0 && `（上乗せ ${formatYen(r.tip)} を含む）`}・{r.paymentMethod}・お届け予定 {r.reward.deliveryEstimate}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 self-start text-xs sm:flex-col">
                  <Link href={`/projects/${r.project.slug}/updates`} className="border border-stone-300 px-3 py-1.5 text-center hover:bg-stone-100">
                    活動報告
                  </Link>
                  <Link href={`/mypage/messages?to=${r.project.slug}`} className="border border-stone-300 px-3 py-1.5 text-center hover:bg-stone-100">
                    質問する
                  </Link>
                  {r.amount > 0 && status.label.startsWith("決済済み") && (
                    <button type="button" onClick={() => openReceipt(r, user?.name ?? "")} className="border border-stone-300 px-3 py-1.5 hover:bg-stone-100">
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
