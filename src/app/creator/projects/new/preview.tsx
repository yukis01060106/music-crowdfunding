"use client";

/* eslint-disable @next/next/no-img-element -- 選んだファイルの一時 URL は next/image で最適化できない */

import { useEffect, useState } from "react";
import { FUNDING_MODEL_LABELS, GENRE_LABELS, REWARD_KIND_LABELS } from "@/types";
import { formatDuration, formatYen } from "@/lib/format";
import { budgetTotal, toEmbedUrl, toNumber, type Draft } from "./draft";

const monthLabel = (m: string) => (m ? `${m.slice(0, 4)}年${Number(m.slice(5, 7))}月` : "未定");

/** 公開後のプロジェクトページに近い見た目で、下書きを確認する */
export function Preview({ d, onClose }: { d: Draft; onClose: () => void }) {
  const [device, setDevice] = useState<"pc" | "sp">("pc");
  const [imageIndex, setImageIndex] = useState(0);
  const embed = toEmbedUrl(d.videoUrl);
  const total = budgetTotal(d);
  const goal = toNumber(d.goal);
  const image = d.images[Math.min(imageIndex, d.images.length - 1)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/80 backdrop-blur-sm animate-fade" role="dialog" aria-modal aria-label="プレビュー">
      <div className="flex items-center justify-between gap-2 bg-ink px-4 py-3 text-white">
        <p className="text-sm font-bold">プレビュー（支援者にはこう見えます）</p>
        <div className="flex items-center gap-2 text-xs">
          {(["pc", "sp"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setDevice(v)} aria-pressed={device === v} className={`px-3 py-1.5 ${device === v ? "bg-white text-ink" : "border border-white/40"}`}>
              {v === "pc" ? "PC" : "スマホ"}
            </button>
          ))}
          <button type="button" onClick={onClose} className="ml-2 bg-brand px-4 py-1.5 font-bold">
            閉じる
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`mx-auto bg-white transition-all duration-500 ${device === "sp" ? "max-w-[390px]" : "max-w-5xl"}`}>
          <div className="p-5">
            <p className="text-xs text-stone-500">プロジェクト › {GENRE_LABELS[d.genre]}</p>
            <h1 className="mt-2 text-2xl font-black leading-snug tracking-[0.08em]">{d.title || "（タイトル未入力）"}</h1>
            <p className="mt-2 text-stone-600">{d.catchcopy}</p>

            <div className={`mt-5 grid gap-6 ${device === "pc" ? "grid-cols-[1fr_300px]" : ""}`}>
              <div className="min-w-0 space-y-6">
                <div>
                  <div className="aspect-[3/2] overflow-hidden bg-stone-200">
                    {image ? <img key={image.id} src={image.url} alt="" className="h-full w-full object-cover animate-fade" /> : <div className="flex h-full items-center justify-center text-sm text-stone-400">メイン画像が未設定です</div>}
                  </div>
                  {d.images.length > 1 && (
                    <div className="mt-2 flex gap-2">
                      {d.images.map((img, i) => (
                        <button key={img.id} type="button" onClick={() => setImageIndex(i)} className={`h-12 w-18 overflow-hidden transition ${i === imageIndex ? "ring-2 ring-brand" : "opacity-60 hover:opacity-100"}`}>
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {embed && (
                  <div className="aspect-video bg-black">
                    <iframe src={embed} title="紹介動画" className="h-full w-full" allowFullScreen />
                  </div>
                )}
                {d.tracks.length > 0 && (
                  <section className="border border-stone-200 bg-white p-4">
                    <h2 className="mb-2 text-sm font-bold text-stone-500">試聴する</h2>
                    <ol className="divide-y divide-stone-100 text-sm">
                      {d.tracks.map((t) => (
                        <li key={t.id} className="flex justify-between py-2">
                          <span>{t.title}</span>
                          <span className="text-stone-400">{formatDuration(Math.min(t.durationSec, 90))}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {d.summary.some((s) => s.trim()) && (
                  <section className="bg-brand-soft/60 p-5">
                    <h2 className="text-sm font-bold text-brand">このプロジェクトで実現すること</h2>
                    <ul className="mt-3 space-y-2">
                      {d.summary.filter((s) => s.trim()).map((s) => (
                        <li key={s} className="flex gap-2 font-medium">
                          <span className="text-brand">♪</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <PreviewSection title="ストーリー">
                  <div className="space-y-4 leading-loose text-stone-700">
                    {d.story.map((b) => {
                      if (b.type === "heading") return b.text && <h3 key={b.id} className="border-b-2 border-brand/30 pb-1 text-lg font-bold text-ink">{b.text}</h3>;
                      if (b.type === "text") return b.text && <p key={b.id} className="whitespace-pre-wrap">{b.text}</p>;
                      if (b.type === "image")
                        return (
                          b.url && (
                            <figure key={b.id}>
                              <img src={b.url} alt="" className="w-full" />
                              {b.text && <figcaption className="mt-1 text-center text-xs text-stone-500">{b.text}</figcaption>}
                            </figure>
                          )
                        );
                      const url = b.url && toEmbedUrl(b.url);
                      return (
                        url && (
                          <div key={b.id} className="aspect-video bg-black">
                            <iframe src={url} title="動画" className="h-full w-full" allowFullScreen />
                          </div>
                        )
                      );
                    })}
                  </div>
                </PreviewSection>
                {total > 0 && (
                  <PreviewSection title="資金の使い道">
                    <ul className="space-y-3">
                      {d.budget.filter((b) => b.label && toNumber(b.amount) > 0).map((b) => (
                        <li key={b.id}>
                          <div className="flex justify-between text-sm">
                            <span>{b.label}</span>
                            <span className="font-medium">{formatYen(toNumber(b.amount))}</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-stone-100">
                            <div className="h-full rounded-full bg-brand/70" style={{ width: `${(toNumber(b.amount) / total) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PreviewSection>
                )}
                {d.schedule.some((s) => s.label) && (
                  <PreviewSection title="スケジュール">
                    <ol className="space-y-3 border-l-2 border-brand-soft pl-5">
                      {d.schedule.filter((s) => s.label).map((s) => (
                        <li key={s.id}>
                          <p className="text-xs text-stone-500">{monthLabel(s.month)}</p>
                          <p className="font-medium">{s.label}</p>
                        </li>
                      ))}
                    </ol>
                  </PreviewSection>
                )}
                {d.risks && (
                  <PreviewSection title="リスクとチャレンジ">
                    <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{d.risks}</p>
                  </PreviewSection>
                )}
                {d.faqs.some((f) => f.q && f.a) && (
                  <PreviewSection title="よくある質問">
                    <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
                      {d.faqs.filter((f) => f.q && f.a).map((f) => (
                        <div key={f.id} className="p-4 text-sm">
                          <p className="font-medium">Q. {f.q}</p>
                          <p className="mt-1 text-stone-600">A. {f.a}</p>
                        </div>
                      ))}
                    </div>
                  </PreviewSection>
                )}
              </div>

              <aside className="space-y-4">
                <div className="space-y-2 border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-500">{d.goalType === "participants" ? "参加人数" : "現在の支援総額"}</p>
                  <p className="text-2xl font-bold">{d.goalType === "participants" ? "0人" : "¥0"}</p>
                  <p className="text-xs text-stone-500">目標 {goal > 0 ? (d.goalType === "participants" ? `${goal}人` : formatYen(goal)) : "未設定"}・{d.days}日間</p>
                  <div className="h-2 rounded-full bg-stone-100" />
                  <p className="bg-stone-50 p-2 text-xs text-stone-600">{FUNDING_MODEL_LABELS[d.fundingModel]}</p>
                  <p className="rounded-full bg-brand py-2.5 text-center text-sm font-bold text-white">このプロジェクトを支援する</p>
                </div>
                <p className="font-bold">リターンを選ぶ</p>
                {d.rewards.map((r) => (
                  <div key={r.id} className="border border-stone-200 bg-white p-4">
                    {r.image && <img src={r.image.url} alt="" className="mb-3 aspect-[3/2] w-full object-cover" />}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xl font-bold">{r.kind === "free" ? "0円" : toNumber(r.price) > 0 ? formatYen(toNumber(r.price)) : "¥—"}</span>
                      <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">{REWARD_KIND_LABELS[r.kind]}</span>
                    </div>
                    <p className="mt-2 font-bold">{r.title || "（リターン名未入力）"}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{r.description}</p>
                    {(r.kind !== "free" || r.limit || r.validUntil) && (
                      <dl className="mt-3 grid grid-cols-2 gap-1 border-t border-stone-100 pt-2 text-xs text-stone-500">
                        {r.kind !== "free" && (
                          <>
                            <dt>お届け予定</dt>
                            <dd className="text-right">{monthLabel(r.deliveryMonth)}</dd>
                          </>
                        )}
                        {r.limit && (
                          <>
                            <dt>数量</dt>
                            <dd className="text-right">限定{r.limit}</dd>
                          </>
                        )}
                        {r.validUntil && (
                          <>
                            <dt>{r.kind === "ticket" ? "公演日" : "有効期限"}</dt>
                            <dd className="text-right">{r.validUntil.replaceAll("-", "/")}</dd>
                          </>
                        )}
                      </dl>
                    )}
                    {r.note && <p className="mt-2 whitespace-pre-wrap bg-stone-50 p-2 text-xs text-stone-500">※ {r.note}</p>}
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 border-l-4 border-brand pl-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
