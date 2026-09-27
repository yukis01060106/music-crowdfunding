"use client";

import { useState } from "react";
import { assetPath } from "@/lib/asset-path";
import { ruleCheck, SEVERITY_LABELS, type ProofreadField, type ProofreadIssue, type Severity } from "@/lib/proofread";

const HAS_SERVER = process.env.NEXT_PUBLIC_HAS_SERVER === "1";

const SEVERITY_STYLES: Record<Severity, string> = {
  error: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-700",
};

const ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/**
 * 文章の校正パネル。ルールチェック（即時）と AI校正（Gemini）の結果を並べ、
 * 修正案はワンクリックで反映できる。
 */
export function ProofreadPanel({
  fields,
  onApply,
  onJump,
}: {
  fields: ProofreadField[];
  onApply: (fieldId: string, excerpt: string, replacement: string) => void;
  /** 指摘された欄へ移動する（タブの切り替えなど） */
  onJump?: (fieldId: string) => void;
}) {
  const [issues, setIssues] = useState<ProofreadIssue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const labelOf = new Map(fields.map((f) => [f.id, f.label]));
  const keyOf = (i: ProofreadIssue) => `${i.source}|${i.fieldId}|${i.excerpt}|${i.reason}`;

  async function run() {
    setLoading(true);
    setNotice(null);
    setDismissed(new Set());
    const found = ruleCheck(fields);
    if (!HAS_SERVER) {
      setNotice("デモ版ではルールチェックのみ動きます。AI校正（Gemini）はサーバー版で使えます。");
    } else {
      try {
        const res = await fetch(assetPath("/api/proofread"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
        });
        const data = (await res.json()) as { issues?: ProofreadIssue[]; error?: string };
        if (data.error) setNotice(`${data.error} ルールチェックの結果だけを表示しています。`);
        // ルールと AI が同じ箇所を指したら、ルール側を残す
        const ruleKeys = new Set(found.map((i) => `${i.fieldId}|${i.excerpt}`));
        found.push(...(data.issues ?? []).filter((i) => !ruleKeys.has(`${i.fieldId}|${i.excerpt}`)));
      } catch {
        setNotice("AI校正に接続できませんでした。ルールチェックの結果だけを表示しています。");
      }
    }
    setIssues(found.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]));
    setLoading(false);
  }

  function apply(issue: ProofreadIssue) {
    onApply(issue.fieldId, issue.excerpt, issue.suggestion ?? "");
    setDismissed((prev) => new Set(prev).add(keyOf(issue)));
  }

  const visible = issues?.filter((i) => !dismissed.has(keyOf(i))) ?? [];
  const errorCount = visible.filter((i) => i.severity === "error").length;

  return (
    <section className="border border-stone-200 bg-white p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">
          <span aria-hidden>✦ </span>AI校正
        </p>
        {issues && (
          <span className={`px-2 py-0.5 text-xs font-bold ${errorCount > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
            {visible.length === 0 ? "指摘なし" : `${visible.length}件${errorCount > 0 ? `（要修正${errorCount}）` : ""}`}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-stone-500">
        誤字脱字、読みやすさ、審査で差し戻されやすい表現（根拠のない「日本初」、「投資」「寄付」など）をチェックします。
      </p>
      <button
        type="button"
        onClick={run}
        disabled={loading || fields.length === 0}
        className="mt-3 w-full bg-ink py-2.5 font-bold tracking-wider text-white transition hover:bg-brand disabled:bg-stone-300"
      >
        {loading ? "校正しています…" : issues ? "もう一度チェック" : "文章をチェックする"}
      </button>
      {HAS_SERVER && (
        <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
          AI校正は Google の Gemini API を使います。無料枠では、送った文章が Google のサービス改善に使われることがあります。
        </p>
      )}
      {notice && <p className="mt-3 bg-amber-50 p-2 text-xs text-amber-800">{notice}</p>}

      {issues && visible.length === 0 && !loading && (
        <p className="mt-3 bg-emerald-50 p-3 text-xs text-emerald-800">気になる表現は見つかりませんでした。</p>
      )}
      <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
        {visible.map((issue) => (
          <li key={keyOf(issue)} className="animate-rise border border-stone-200 p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className={`px-1.5 py-0.5 font-bold ${SEVERITY_STYLES[issue.severity]}`}>{SEVERITY_LABELS[issue.severity]}</span>
              <span className="text-stone-400">{issue.source === "ai" ? "AI" : "ルール"}</span>
              <button type="button" onClick={() => onJump?.(issue.fieldId)} className="truncate text-stone-500 underline-offset-2 hover:underline">
                {labelOf.get(issue.fieldId) ?? issue.fieldId}
              </button>
            </div>
            <p className="mt-1.5 break-all">
              <span className="bg-rose-50 text-rose-700 line-through decoration-rose-300">{issue.excerpt}</span>
              {issue.suggestion !== undefined && (
                <>
                  <span className="mx-1 text-stone-400" aria-hidden>
                    →
                  </span>
                  <span className="bg-emerald-50 font-bold text-emerald-700">{issue.suggestion || "（削除）"}</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600">{issue.reason}</p>
            <div className="mt-2 flex gap-2 text-xs">
              {issue.suggestion !== undefined && (
                <button type="button" onClick={() => apply(issue)} className="bg-brand px-3 py-1 font-bold text-white hover:bg-brand-dark">
                  反映する
                </button>
              )}
              <button
                type="button"
                onClick={() => setDismissed((prev) => new Set(prev).add(keyOf(issue)))}
                className="border border-stone-300 px-3 py-1 text-stone-500 hover:bg-stone-100"
              >
                このままにする
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
