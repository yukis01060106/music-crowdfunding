"use client";

import { useState } from "react";
import { ruleCheck } from "@/lib/proofread";
import { useDemo } from "@/lib/demo-store";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export interface QueueItem {
  id: string;
  title: string;
  artist: string;
  submittedAt: string;
  goal: string;
  story: string;
  rewards: string[];
  flags: { identity: boolean; cover: boolean; minor: boolean };
}

type Decision = "approved" | "rejected";

const CHECKS = [
  { key: "purpose", label: "目的と資金の使い道が明確" },
  { key: "feasible", label: "スケジュールとリターンが実現できる" },
  { key: "rights", label: "カバー曲・写真などの権利関係に問題がない" },
  { key: "expression", label: "誇大表現・金融商品と誤解される表現がない" },
  { key: "reward", label: "リターンの内容・時期・有効期限が明記されている" },
];

const REJECT_TEMPLATES = [
  "資金の使い道を、項目ごとの金額まで具体的に書いてください。",
  "根拠のない最上級表現（日本初・No.1 など）を修正してください。",
  "カバー曲の許諾を証明する書類を提出してください。",
  "リターンのお届け予定・有効期限を明記してください。",
];

// TODO: 審査の結果は Supabase に保存し、実行者にメールで通知する。運営ロールだけが操作できるようにする
export function ReviewQueue({ items: fixed }: { items: QueueItem[] }) {
  // 実行者画面から提出されたプロジェクトも並べる
  const { submissions } = useDemo();
  const items = [...submissions, ...fixed];
  const [decisions, setDecisions] = useState<Record<string, { decision: Decision; note?: string }>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"review" | "reject">("review");

  const open = items.find((i) => i.id === openId);
  const pending = items.filter((i) => !decisions[i.id]);
  const done = items.filter((i) => decisions[i.id]);
  const issues = open ? ruleCheck([{ id: "story", label: "ストーリー", text: `${open.title}\n${open.story}` }]) : [];
  const allChecked = CHECKS.every((c) => checked[c.key]);

  function start(id: string) {
    setOpenId(id);
    setChecked({});
    setReason("");
    setMode("review");
  }

  function decide(decision: Decision) {
    if (!open) return;
    setDecisions((prev) => ({ ...prev, [open.id]: { decision, note: decision === "rejected" ? reason : undefined } }));
    toast(decision === "approved" ? `「${open.title}」を承認しました` : `「${open.title}」を差し戻しました`);
    setOpenId(null);
  }

  return (
    <>
      <h2 className="mb-3 font-bold">
        審査待ち <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-xs text-white">{pending.length}</span>
      </h2>
      {pending.length === 0 ? (
        <p className="border-2 border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">審査待ちのプロジェクトはありません 🎉</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((q) => (
            <li key={q.id} className="animate-rise flex flex-wrap items-center gap-3 border border-stone-200 bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{q.title}</p>
                <p className="text-sm text-stone-500">
                  {q.artist}・{q.submittedAt} 提出・目標 {q.goal}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  {!q.flags.identity && <span className="bg-rose-100 px-1.5 py-0.5 text-rose-700">本人確認 未完了</span>}
                  {q.flags.cover && <span className="bg-amber-100 px-1.5 py-0.5 text-amber-800">カバー曲あり</span>}
                  {q.flags.minor && <span className="bg-sky-100 px-1.5 py-0.5 text-sky-700">18歳未満（保護者同意）</span>}
                </div>
              </div>
              <button type="button" onClick={() => start(q.id)} className="bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-brand">
                審査する
              </button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 font-bold">審査済み</h2>
          <ul className="space-y-2">
            {done.map((q) => {
              const d = decisions[q.id];
              return (
                <li key={q.id} className="flex flex-wrap items-center gap-3 border border-stone-200 bg-white p-3 text-sm">
                  <span className={`px-2 py-0.5 text-xs font-bold ${d.decision === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {d.decision === "approved" ? "承認" : "差し戻し"}
                  </span>
                  <span className="flex-1 font-medium">{q.title}</span>
                  {d.note && <span className="w-full text-xs text-stone-500">理由：{d.note}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog open={open !== undefined} onClose={() => setOpenId(null)} title={open?.title ?? ""} wide>
        {open && (
          <div className="space-y-5 text-sm">
            <p className="text-stone-500">
              {open.artist}・目標 {open.goal}・{open.submittedAt} 提出
            </p>
            <div className="bg-stone-50 p-4 leading-relaxed text-stone-700">{open.story}</div>
            <div>
              <p className="font-bold">リターン</p>
              <ul className="mt-1 list-disc pl-5 text-stone-700">
                {open.rewards.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div className={issues.length ? "bg-amber-50 p-3" : "bg-emerald-50 p-3"}>
              <p className="font-bold">{issues.length ? `✦ 表現チェックで${issues.length}件の指摘` : "✦ 表現チェック：指摘なし"}</p>
              {issues.map((i) => (
                <p key={i.excerpt + i.reason} className="mt-1 text-xs text-stone-700">
                  「{i.excerpt}」— {i.reason}
                </p>
              ))}
            </div>

            {mode === "review" ? (
              <>
                <fieldset>
                  <legend className="font-bold">確認項目</legend>
                  <ul className="mt-2 space-y-1.5">
                    {CHECKS.map((c) => (
                      <li key={c.key}>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={Boolean(checked[c.key])} onChange={(e) => setChecked((prev) => ({ ...prev, [c.key]: e.target.checked }))} className="accent-brand" />
                          {c.label}
                        </label>
                      </li>
                    ))}
                    <li className={`flex items-center gap-2 ${open.flags.identity ? "text-emerald-700" : "text-rose-600"}`}>
                      {open.flags.identity ? "✓ 本人確認が完了している" : "✕ 本人確認が完了していません（承認できません）"}
                    </li>
                  </ul>
                </fieldset>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMode("reject")} className="border border-stone-300 px-5 py-2.5 hover:bg-stone-100">
                    差し戻す
                  </button>
                  <button type="button" disabled={!allChecked || !open.flags.identity} onClick={() => decide("approved")} className="bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:bg-stone-300">
                    承認する
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="font-bold">差し戻しの理由（実行者に届きます）</span>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-stone-300 p-2" />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REJECT_TEMPLATES.map((t) => (
                    <button key={t} type="button" onClick={() => setReason((r) => (r ? `${r}\n${t}` : t))} className="rounded-full border border-stone-300 px-2.5 py-1 text-xs hover:border-brand hover:text-brand">
                      ＋ {t.slice(0, 16)}…
                    </button>
                  ))}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMode("review")} className="border border-stone-300 px-5 py-2.5 hover:bg-stone-100">
                    戻る
                  </button>
                  <button type="button" disabled={!reason.trim()} onClick={() => decide("rejected")} className="bg-rose-600 px-5 py-2.5 font-bold text-white hover:bg-rose-700 disabled:bg-stone-300">
                    差し戻す
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
