"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FundingModel, GoalType, ProjectStatus } from "@/types";
import { formatDate, formatNumber, formatYen, jstDateKey } from "@/lib/format";
import { downloadCsv, toCsv } from "@/lib/csv";
import { STATUS_LABELS } from "@/app/creator/project-status";
import { TAG_BASE, tagClass } from "@/components/ui/tag";
import { buttonClass } from "@/components/ui/button";
import { chipClass } from "@/components/ui/chip";
import { searchInputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { resumeProject, suspendProject, useAdmin } from "@/lib/admin-store";
import { useDemo } from "@/lib/demo-store";
import { DemoNote, TableBox, TD, TH } from "../admin-ui";
import { ResumeDialog, StopDialog } from "./suspend-control";

export interface AdminProjectRow {
  slug: string;
  title: string;
  artist: string;
  status: ProjectStatus;
  fundingModel: FundingModel;
  goalType: GoalType;
  raised: number;
  backers: number;
  percent: number;
  endAt: string;
}

/** 通報（対象のプロジェクトと、元の対応の状態） */
export interface ProjectReport {
  id: string;
  slug: string;
  status: "open" | "in_progress" | "done";
}

const FILTERS = [
  { key: "all", label: "すべて" },
  { key: "live", label: "募集中" },
  { key: "ended", label: "終了" },
  { key: "suspended", label: "掲載停止" },
] as const;

// TODO（本番）: 掲載の停止は Supabase の status を書き換え、実行者と支援者に理由をメールで知らせる
export function ProjectsTable({ rows, reports }: { rows: AdminProjectRow[]; reports: ProjectReport[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const admin = useAdmin();
  const suspended = admin.suspendedProjects;
  const [dialog, setDialog] = useState<{ row: AdminProjectRow; kind: "stop" | "resume" } | null>(null);
  const statusRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  // 完了にした通報は外す（保存した対応の状況を重ねる）
  const { inquiries } = useDemo();
  const allReports = [...inquiries.filter((i) => i.kind === "report" && i.targetSlug).map((i) => ({ id: i.id, slug: i.targetSlug!, status: "open" as const })), ...reports];
  const reported = new Set(allReports.filter((r) => (admin.inboxStatus[r.id] ?? r.status) !== "done").map((r) => r.slug));

  // 古いリンク（#stop-スラッグ）で来たときは、そのプロジェクトの停止のダイアログを開く
  useEffect(() => {
    if (!window.location.hash.startsWith("#stop-")) return;
    let slug = "";
    try {
      slug = decodeURIComponent(window.location.hash.slice("#stop-".length));
    } catch {
      return; // 壊れたハッシュは無視する
    }
    const row = rows.find((x) => x.slug === slug);
    if (!row) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- URL のハッシュはブラウザでしか読めない */
    setDialog({ row, kind: "stop" });
    history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => {
    if (q && !`${r.title} ${r.artist}`.toLowerCase().includes(q)) return false;
    if (filter === "live") return r.status === "live" && !suspended[r.slug];
    if (filter === "ended") return r.status === "succeeded" || r.status === "failed";
    if (filter === "suspended") return Boolean(suspended[r.slug]);
    return true;
  });

  function download() {
    const csvRows = [
      ["プロジェクト", "アーティスト", "方式", "状態", "集まった額", "支援者", "達成率", "終了日", "掲載停止の理由"],
      ...shown.map((r) => [r.title, r.artist, r.fundingModel === "all_or_nothing" ? "All-or-Nothing" : "All-in", suspended[r.slug] ? "掲載停止" : STATUS_LABELS[r.status].label, r.raised, r.backers, `${r.percent}%`, formatDate(r.endAt), suspended[r.slug] ?? ""]),
    ];
    downloadCsv(`projects-${jstDateKey()}.csv`, toCsv(csvRows));
    toast(`${shown.length}件の一覧を CSV でダウンロードしました`);
  }

  // 操作の後は、ボタンが入れ替わるので、その行の状態の表示にフォーカスを移す（続けて Enter を押しても何も起きないように）
  const focusStatus = (slug: string) => setTimeout(() => statusRefs.current[slug]?.focus(), 50);

  function actionButton(r: AdminProjectRow) {
    return suspended[r.slug] ? (
      <button type="button" onClick={() => setDialog({ row: r, kind: "resume" })} aria-label={`「${r.title}」の掲載を再開する`} className={buttonClass("secondary", "md", "whitespace-nowrap")}>
        再開する
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setDialog({ row: r, kind: "stop" })}
        aria-label={`「${r.title}」の掲載を停止する`}
        className="min-h-11 whitespace-nowrap px-2 text-sm text-rose-700 underline underline-offset-4 hover:text-rose-900"
      >
        掲載を停止
      </button>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">タイトル・アーティスト名で検索</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="タイトル・アーティスト名で検索" className={searchInputClass} />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="状態で絞り込む">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className={chipClass(filter === f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-500" aria-live="polite">
          {shown.length}件を表示
        </p>
        {shown.length > 0 && (
          <button type="button" onClick={download} className={buttonClass("secondary", "md")}>
            CSV をダウンロード
          </button>
        )}
      </div>
      <TableBox label="プロジェクトの一覧" minWidth={680}>
        <thead className="bg-stone-50">
          <tr>
            <th className={TH}>プロジェクト</th>
            <th className={TH}>状態</th>
            <th className={`${TH} text-right`}>集まった額</th>
            <th className={`${TH} text-right`}>達成率</th>
            <th className={TH}>終了日</th>
            <th className={`${TH} hidden md:table-cell`}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {shown.map((r) => {
            const stop = suspended[r.slug];
            const status = STATUS_LABELS[r.status];
            return (
              <tr key={r.slug}>
                <th scope="row" className={`${TD} text-left font-normal`}>
                  <Link href={`/admin/projects/${r.slug}`} className="font-bold hover:text-brand hover:underline">
                    {r.title}
                  </Link>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    {r.artist}・{r.fundingModel === "all_or_nothing" ? "All-or-Nothing" : "All-in"}
                  </span>
                  {reported.has(r.slug) && <span className={tagClass("warning", "mt-1")}>通報あり</span>}
                  {/* スマホでは表の右端が見えにくいので、操作をタイトルの下に出す */}
                  <span className="mt-1 block md:hidden">{actionButton(r)}</span>
                </th>
                <td className={TD}>
                  <span
                    ref={(el) => {
                      statusRefs.current[r.slug] = el;
                    }}
                    tabIndex={-1}
                    className={stop ? tagClass("warning") : `${TAG_BASE} ${status.className}`}
                  >
                    {stop ? "掲載停止" : status.label}
                  </span>
                  {stop && <span className="mt-1 block max-w-[12rem] text-xs text-stone-500">{stop}</span>}
                </td>
                <td className={`${TD} text-right`}>
                  {r.goalType === "participants" ? `${formatNumber(r.backers)}人` : formatYen(r.raised)}
                  <span className="block text-xs text-stone-500">{formatNumber(r.backers)}人が支援</span>
                </td>
                <td className={`${TD} text-right font-en font-bold ${r.percent >= 100 ? "text-emerald-700" : ""}`}>{r.percent}%</td>
                <td className={`${TD} text-stone-600`}>{formatDate(r.endAt)}</td>
                <td className={`${TD} hidden text-right md:table-cell`}>{actionButton(r)}</td>
              </tr>
            );
          })}
          {shown.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-stone-500">
                当てはまるプロジェクトはありません
              </td>
            </tr>
          )}
        </tbody>
      </TableBox>

      <StopDialog
        open={dialog?.kind === "stop"}
        title={dialog?.row.title ?? ""}
        onClose={() => setDialog(null)}
        onDone={(reason) => {
          if (!dialog) return;
          suspendProject(dialog.row.slug, dialog.row.title, reason);
          toast(`「${dialog.row.title}」の掲載を停止しました`);
          focusStatus(dialog.row.slug);
          setDialog(null);
        }}
      />
      <ResumeDialog
        open={dialog?.kind === "resume"}
        title={dialog?.row.title ?? ""}
        onClose={() => setDialog(null)}
        onDone={(note) => {
          if (!dialog) return;
          resumeProject(dialog.row.slug, dialog.row.title, note);
          toast(`「${dialog.row.title}」の掲載を再開しました`);
          focusStatus(dialog.row.slug);
          setDialog(null);
        }}
      />

      <DemoNote>デモのため、見本のプロジェクトはすべて募集中です（「終了」は0件）。停止・再開はこのブラウザに保存され、「操作の記録」に残ります。本番では、停止すると実行者と支援者にメールで理由を知らせます。</DemoNote>
    </>
  );
}
