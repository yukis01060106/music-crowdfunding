"use client";

/* eslint-disable @next/next/no-img-element -- 選んだファイルの一時 URL は next/image で最適化できない */

import { useState } from "react";
import {
  ARTIST_TYPE_LABELS,
  FUNDING_MODEL_LABELS,
  GENRE_LABELS,
  MINOR_ARTIST_TYPES,
  REWARD_KIND_LABELS,
  type ArtistType,
  type FundingModel,
  type Genre,
  type RewardKind,
} from "@/types";
import { formatDuration, formatYen } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { PLATFORM_FEE_RATE, payoutAmount } from "@/lib/fees";
import {
  budgetTotal,
  CATCHCOPY_MAX,
  DAYS_MAX,
  DAYS_MIN,
  emptyReward,
  IMAGE_MAX_COUNT,
  IMAGE_MAX_MB,
  IMAGE_MIN_WIDTH,
  IMAGE_RATIO,
  newId,
  REWARD_RECOMMENDED,
  rewardProblems,
  RISKS_TEMPLATE,
  STORY_MIN,
  STORY_TEMPLATE,
  storyText,
  TITLE_MAX,
  toEmbedUrl,
  toNumber,
  TRACK_MAX_COUNT,
  TRACK_MAX_MB,
  TRACK_MAX_SEC,
  type Draft,
  type DraftImage,
  type DraftReward,
  type StoryBlock,
  type StoryBlockType,
} from "./draft";
import { AddButton, Field, inputClass, move, readAudio, readImage, RowActions, Tip, toMb } from "./editor-ui";

export type Update = (fn: (d: Draft) => Draft) => void;

interface SectionProps {
  d: Draft;
  update: Update;
}

function setter(update: Update) {
  return <K extends keyof Draft>(key: K, value: Draft[K]) => update((prev) => ({ ...prev, [key]: value }));
}

/* ───────── 基本情報 ───────── */

export function BasicsSection({ d, update }: SectionProps) {
  const set = setter(update);
  const needsGuardian = d.artistTypes.some((t) => MINOR_ARTIST_TYPES.includes(t));
  const days = toNumber(d.days);
  const now = useNow();
  const endDate = now !== null && days >= DAYS_MIN ? new Date(now + days * 86_400_000) : null;

  return (
    <>
      <Field
        label="プロジェクトタイトル"
        hint={`${d.title.length}/${TITLE_MAX}文字。「誰が」「何を」するのかが一目でわかるように。`}
        error={d.title.length > TITLE_MAX ? `${TITLE_MAX}文字以内にしてください（いま${d.title.length}文字）` : null}
      >
        <input value={d.title} onChange={(e) => set("title", e.target.value)} className={inputClass} placeholder="例: 結成7年目、初のフルアルバムを作りたい" />
      </Field>
      <Field
        label="キャッチコピー"
        hint={`${d.catchcopy.length}/${CATCHCOPY_MAX}文字。一覧やSNSでシェアされたときに、タイトルの下に表示されます。`}
        error={d.catchcopy.length > CATCHCOPY_MAX ? `${CATCHCOPY_MAX}文字以内にしてください` : null}
      >
        <input value={d.catchcopy} onChange={(e) => set("catchcopy", e.target.value)} className={inputClass} placeholder="例: 夜とラジオをテーマにした10曲を、CDとアナログ盤で届けたい" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ジャンル">
          <select value={d.genre} onChange={(e) => set("genre", e.target.value as Genre)} className={inputClass}>
            {(Object.entries(GENRE_LABELS) as [Genre, string][]).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="達成方式" hint="迷ったらAll-or-Nothing。目標に届かなければ支援者は支払わないので、安心して支援できます。">
          <select value={d.fundingModel} onChange={(e) => set("fundingModel", e.target.value as FundingModel)} className={inputClass}>
            {(Object.entries(FUNDING_MODEL_LABELS) as [FundingModel, string][]).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="目標の種類" hint="ライブの動員を集めたいなら「参加人数」。0円プランの参加者も数えます。">
          <select value={d.goalType} onChange={(e) => set("goalType", e.target.value as Draft["goalType"])} className={inputClass}>
            <option value="amount">金額</option>
            <option value="participants">参加人数</option>
          </select>
        </Field>
        <Field
          label={d.goalType === "amount" ? "目標金額（円）" : "目標人数（人）"}
          hint={d.goalType === "amount" ? "「資金・スケジュール」タブで、必要経費から目標金額を計算できます。" : undefined}
          error={d.goal && !(toNumber(d.goal) > 0) ? "1以上の数字を入力してください" : null}
        >
          <input type="number" inputMode="numeric" min={1} value={d.goal} onChange={(e) => set("goal", e.target.value)} className={inputClass} />
        </Field>
        <Field
          label="募集期間（日）"
          hint={`${DAYS_MIN}〜${DAYS_MAX}日。30〜45日がおすすめ。支援は最初と最後の数日に集まります。${endDate ? `今日公開すると ${endDate.toLocaleDateString("ja-JP")} まで。` : ""}`}
          error={d.days && (days < DAYS_MIN || days > DAYS_MAX) ? `${DAYS_MIN}〜${DAYS_MAX}日の間で入力してください` : null}
        >
          <input type="number" inputMode="numeric" min={DAYS_MIN} max={DAYS_MAX} value={d.days} onChange={(e) => set("days", e.target.value)} className={inputClass} />
        </Field>
      </div>
      <fieldset className="text-sm">
        <legend className="font-medium">アーティストタイプ（複数選べます）</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.entries(ARTIST_TYPE_LABELS) as [ArtistType, string][]).map(([t, label]) => {
            const on = d.artistTypes.includes(t);
            return (
              <label key={t} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 transition ${on ? "border-brand bg-brand-soft text-brand" : "border-stone-300 hover:border-stone-400"}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => set("artistTypes", e.target.checked ? [...d.artistTypes, t] : d.artistTypes.filter((x) => x !== t))}
                  className="accent-brand"
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
      {needsGuardian && (
        <div className="animate-rise space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>18歳未満の方は、保護者の同意がないとプロジェクトを公開できません。</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={d.guardianConsent} onChange={(e) => set("guardianConsent", e.target.checked)} className="accent-brand" />
            保護者の同意を得ています（審査時に同意書を提出します）
          </label>
        </div>
      )}
    </>
  );
}

/* ───────── 写真・動画 ───────── */

async function toDraftImage(file: File): Promise<DraftImage | string> {
  if (!file.type.startsWith("image/")) return `${file.name}: 画像ファイルではありません`;
  if (file.size > IMAGE_MAX_MB * 1024 * 1024) return `${file.name}: ${IMAGE_MAX_MB}MBを超えています（${toMb(file.size)}MB）`;
  try {
    const { url, width, height } = await readImage(file);
    return { id: newId(), name: file.name, url, width, height, sizeMb: toMb(file.size) };
  } catch {
    return `${file.name}: 読み込めませんでした`;
  }
}

function imageWarnings(img: DraftImage): string[] {
  const warnings: string[] = [];
  if (img.width < IMAGE_MIN_WIDTH) warnings.push(`横${img.width}px。${IMAGE_MIN_WIDTH}px以上だときれいに表示されます`);
  const ratio = img.width / img.height;
  if (Math.abs(ratio - IMAGE_RATIO) > 0.15) warnings.push("3:2の比率でないため、端が切れて表示されます");
  return warnings;
}

export function MediaSection({ d, update }: SectionProps) {
  const set = setter(update);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const remaining = IMAGE_MAX_COUNT - d.images.length;
  const embed = toEmbedUrl(d.videoUrl);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files);
    const results = await Promise.all(picked.slice(0, remaining).map(toDraftImage));
    const added = results.filter((r): r is DraftImage => typeof r !== "string");
    const errs = results.filter((r): r is string => typeof r === "string");
    if (picked.length > remaining) errs.push(`メイン画像は${IMAGE_MAX_COUNT}枚までです。${picked.length - remaining}枚は追加していません`);
    setErrors(errs);
    update((prev) => ({ ...prev, images: [...prev.images, ...added] }));
  }

  return (
    <>
      <Tip>
        メイン画像は<strong>最大{IMAGE_MAX_COUNT}枚</strong>。1枚目が表紙になり、一覧やSNSのシェアにも使われます。
        推奨は<strong>3:2・横{IMAGE_MIN_WIDTH}px以上・{IMAGE_MAX_MB}MBまで</strong>。文字を入れすぎず、アーティストの顔が見える写真が選ばれやすいです。
      </Tip>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition ${dragging ? "scale-[1.01] border-brand bg-brand-soft" : "border-stone-300"}`}
      >
        <p className="text-sm font-medium">ここに画像をドロップ</p>
        <p className="mt-1 text-xs text-stone-500">
          あと{remaining}枚追加できます（{d.images.length}/{IMAGE_MAX_COUNT}）
        </p>
        <label className={`mt-3 inline-block cursor-pointer bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-brand ${remaining === 0 ? "pointer-events-none opacity-40" : ""}`}>
          画像を選ぶ
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={remaining === 0}
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {errors.length > 0 && (
        <ul className="space-y-1 text-xs text-rose-600">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {d.images.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {d.images.map((img, i) => (
            <li key={img.id} className="animate-rise overflow-hidden border border-stone-200 bg-white">
              <div className="relative aspect-[3/2] bg-stone-100">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 bg-brand px-2 py-0.5 text-xs font-bold text-white">表紙</span>}
              </div>
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                <span className="min-w-0 truncate text-stone-500">
                  {img.width}×{img.height}・{img.sizeMb}MB
                </span>
                <div className="flex items-center">
                  {i !== 0 && (
                    <button type="button" onClick={() => set("images", move(d.images, i, 0))} className="rounded px-2 py-1.5 text-brand hover:bg-brand-soft">
                      表紙にする
                    </button>
                  )}
                  <RowActions
                    index={i}
                    length={d.images.length}
                    onMove={(from, to) => set("images", move(d.images, from, to))}
                    onRemove={() => {
                      URL.revokeObjectURL(img.url);
                      set("images", d.images.filter((x) => x.id !== img.id));
                    }}
                  />
                </div>
              </div>
              {imageWarnings(img).map((w) => (
                <p key={w} className="border-t border-amber-100 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                  {w}
                </p>
              ))}
            </li>
          ))}
        </ol>
      )}

      <Field
        label="紹介動画（YouTube / Vimeo のURL）"
        optional
        hint="ライブ映像やメンバーからのメッセージ動画があると、支援の決め手になりやすいです。1〜3分がおすすめ。"
        error={d.videoUrl.trim() && !embed ? "YouTube か Vimeo の動画のURLを入力してください" : null}
      >
        <input value={d.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className={inputClass} placeholder="https://www.youtube.com/watch?v=..." inputMode="url" />
      </Field>
      {embed && (
        <div className="animate-rise aspect-video overflow-hidden bg-black">
          <iframe src={embed} title="紹介動画のプレビュー" className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      )}
    </>
  );
}

/* ───────── ストーリー ───────── */

const BLOCK_LABELS: Record<StoryBlockType, string> = { heading: "見出し", text: "本文", image: "画像", video: "動画" };

export function StorySection({ d, update }: SectionProps) {
  const set = setter(update);
  const length = storyText(d).length;
  const setBlock = (id: string, patch: Partial<StoryBlock>) =>
    update((prev) => ({ ...prev, story: prev.story.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const addBlock = (type: StoryBlockType) => set("story", [...d.story, { id: newId(), type, text: "" }]);

  return (
    <>
      <Field label="このプロジェクトで実現すること（3つまで）" hint="スマホでは、ページの冒頭しか読まれないことが多いです。ここだけで伝わるように、1行ずつ短く。">
        <div className="mt-1 space-y-2">
          {d.summary.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-brand" aria-hidden>
                ♪
              </span>
              <input
                value={s}
                onChange={(e) => set("summary", d.summary.map((x, j) => (j === i ? e.target.value : x)))}
                className={`${inputClass} mt-0`}
                placeholder={["初のフルアルバムを制作", "CDとアナログ盤でリリース", "レコ発ワンマンを開催"][i]}
                aria-label={`実現すること ${i + 1}`}
              />
              {d.summary.length > 1 && (
                <button type="button" onClick={() => set("summary", d.summary.filter((_, j) => j !== i))} className="shrink-0 px-2 text-xs text-stone-500 hover:text-rose-600">
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      </Field>
      {d.summary.length < 3 && <AddButton onClick={() => set("summary", [...d.summary, ""])}>＋ 実現することを追加</AddButton>}

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-stone-100 pt-5">
        <p className="text-sm font-medium">ストーリー</p>
        <p className={`text-xs ${length >= STORY_MIN ? "text-emerald-600" : "text-stone-500"}`}>
          {length}文字 {length >= STORY_MIN ? "✓" : `（あと${STORY_MIN - length}文字）`}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${Math.min(100, (length / STORY_MIN) * 100)}%` }} />
      </div>
      <p className="text-xs leading-relaxed text-stone-500">
        支援の決め手の1位は「想いへの共感」です。見出しで区切り、写真や動画をはさむと最後まで読まれやすくなります。
      </p>

      <ol className="space-y-3">
        {d.story.map((b, i) => (
          <li key={b.id} className="animate-rise rounded-lg border border-stone-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">{BLOCK_LABELS[b.type]}</span>
              <RowActions index={i} length={d.story.length} onMove={(from, to) => set("story", move(d.story, from, to))} onRemove={() => set("story", d.story.filter((x) => x.id !== b.id))} />
            </div>
            {b.type === "heading" && (
              <input value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} className={`${inputClass} mt-0 font-bold`} placeholder="見出し" aria-label="見出し" />
            )}
            {b.type === "text" && (
              <textarea value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} rows={5} className={`${inputClass} mt-0 leading-relaxed`} placeholder="本文" aria-label="本文" />
            )}
            {b.type === "image" && (
              <div className="space-y-2">
                {b.url ? (
                  <img src={b.url} alt="" className="max-h-72 w-full object-contain" />
                ) : (
                  <label className="block cursor-pointer rounded-lg border-2 border-dashed border-stone-300 p-5 text-center text-sm text-stone-500 hover:border-brand">
                    画像を選ぶ（{IMAGE_MAX_MB}MBまで）
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || file.size > IMAGE_MAX_MB * 1024 * 1024) return;
                        const { url } = await readImage(file);
                        setBlock(b.id, { url });
                      }}
                    />
                  </label>
                )}
                <input value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} className={`${inputClass} mt-0`} placeholder="キャプション（任意）" aria-label="キャプション" />
              </div>
            )}
            {b.type === "video" && (
              <div className="space-y-2">
                <input value={b.url ?? ""} onChange={(e) => setBlock(b.id, { url: e.target.value })} className={`${inputClass} mt-0`} placeholder="YouTube / Vimeo のURL" aria-label="動画のURL" inputMode="url" />
                {b.url && !toEmbedUrl(b.url) && <p className="text-xs text-rose-600">YouTube か Vimeo の動画のURLを入力してください</p>}
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(BLOCK_LABELS) as StoryBlockType[]).map((type) => (
          <AddButton key={type} onClick={() => addBlock(type)}>
            ＋ {BLOCK_LABELS[type]}
          </AddButton>
        ))}
      </div>
      {d.story.length === 0 && (
        <button type="button" onClick={() => set("story", STORY_TEMPLATE.map((b) => ({ ...b, id: newId() })))} className="text-sm text-brand underline">
          構成テンプレートを入れる
        </button>
      )}
    </>
  );
}

/* ───────── 試聴音源 ───────── */

export function TracksSection({ d, update }: SectionProps) {
  const set = setter(update);
  const [errors, setErrors] = useState<string[]>([]);
  const setTrack = (id: string, patch: Partial<Draft["tracks"][number]>) =>
    update((prev) => ({ ...prev, tracks: prev.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const errs: string[] = [];
    const added: Draft["tracks"] = [];
    for (const file of Array.from(files).slice(0, TRACK_MAX_COUNT - d.tracks.length)) {
      if (file.size > TRACK_MAX_MB * 1024 * 1024) {
        errs.push(`${file.name}: ${TRACK_MAX_MB}MBを超えています`);
        continue;
      }
      try {
        const { url, durationSec } = await readAudio(file);
        added.push({ id: newId(), title: file.name.replace(/\.[^.]+$/, ""), fileName: file.name, url, durationSec, sizeMb: toMb(file.size), isCover: false, licensed: false });
      } catch {
        errs.push(`${file.name}: 読み込めませんでした`);
      }
    }
    setErrors(errs);
    update((prev) => ({ ...prev, tracks: [...prev.tracks, ...added] }));
  }

  return (
    <>
      <Tip>
        試聴はページのいちばん上に表示されます。<strong>1曲{TRACK_MAX_SEC}秒まで・{TRACK_MAX_COUNT}曲まで</strong>。
        サビを含む部分を切り出すのがおすすめです。{TRACK_MAX_SEC}秒を超える音源は、公開時に先頭から{TRACK_MAX_SEC}秒で切って再生されます。
      </Tip>
      <label className={`block cursor-pointer rounded-lg border-2 border-dashed border-stone-300 p-6 text-center text-sm transition hover:border-brand ${d.tracks.length >= TRACK_MAX_COUNT ? "pointer-events-none opacity-40" : ""}`}>
        <span className="font-medium">音源を選ぶ（MP3・AAC・WAV）</span>
        <span className="mt-1 block text-xs text-stone-500">
          {d.tracks.length}/{TRACK_MAX_COUNT}曲
        </span>
        <input
          type="file"
          accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav"
          multiple
          className="sr-only"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {errors.map((e) => (
        <p key={e} className="text-xs text-rose-600">
          {e}
        </p>
      ))}
      <ol className="space-y-3">
        {d.tracks.map((t, i) => (
          <li key={t.id} className="animate-rise space-y-2 rounded-lg border border-stone-200 p-3">
            <div className="flex items-center gap-2">
              <span className="font-en text-lg font-black text-brand/40">{String(i + 1).padStart(2, "0")}</span>
              <input value={t.title} onChange={(e) => setTrack(t.id, { title: e.target.value })} className={`${inputClass} mt-0`} aria-label="曲名" />
              <RowActions index={i} length={d.tracks.length} onMove={(from, to) => set("tracks", move(d.tracks, from, to))} onRemove={() => set("tracks", d.tracks.filter((x) => x.id !== t.id))} />
            </div>
            <audio src={t.url} controls className="h-9 w-full" />
            <p className={`text-xs ${t.durationSec > TRACK_MAX_SEC ? "text-amber-700" : "text-stone-500"}`}>
              {formatDuration(t.durationSec)}・{t.sizeMb}MB
              {t.durationSec > TRACK_MAX_SEC && `（${TRACK_MAX_SEC}秒を超えています。試聴は先頭${TRACK_MAX_SEC}秒になります）`}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={t.isCover} onChange={(e) => setTrack(t.id, { isCover: e.target.checked, licensed: false })} className="accent-brand" />
              カバー曲（他の人が作った曲）
            </label>
            {t.isCover && (
              <label className="animate-rise flex items-start gap-2 rounded bg-amber-50 p-2 text-xs text-amber-900">
                <input type="checkbox" checked={t.licensed} onChange={(e) => setTrack(t.id, { licensed: e.target.checked })} className="mt-0.5 accent-brand" />
                著作権者（JASRAC・NexTone などの管理団体や権利者）から、配信・販売の許諾を得ています。審査で許諾の証明をお願いすることがあります。
              </label>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

/* ───────── 資金・スケジュール ───────── */

export function MoneySection({ d, update }: SectionProps) {
  const set = setter(update);
  const total = budgetTotal(d);
  // 経費を手数料込みでまかなうのに必要な目標金額（千円単位で切り上げ）
  const suggestedGoal = total > 0 ? Math.ceil(total / (1 - PLATFORM_FEE_RATE) / 1000) * 1000 : 0;
  const goal = toNumber(d.goal);

  return (
    <>
      <Tip>支援者がいちばん不安なのは「本当に届くのか」です。何にいくら使うのか、いつ何をするのかを具体的に書くほど、支援されやすくなります。</Tip>

      <div>
        <p className="text-sm font-medium">資金の使い道</p>
        <ul className="mt-2 space-y-2">
          {d.budget.map((b, i) => (
            <li key={b.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <input
                value={b.label}
                onChange={(e) => set("budget", d.budget.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))}
                className={`${inputClass} mt-0 flex-1`}
                placeholder={["スタジオ代（10日間）", "CDプレス代（1,000枚）", "リターンの送料"][i % 3]}
                aria-label="項目"
              />
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">¥</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={b.amount}
                  onChange={(e) => set("budget", d.budget.map((x) => (x.id === b.id ? { ...x, amount: e.target.value } : x)))}
                  className={`${inputClass} mt-0 pl-7 text-right`}
                  aria-label="金額"
                />
              </div>
              <RowActions index={i} length={d.budget.length} onMove={(from, to) => set("budget", move(d.budget, from, to))} onRemove={d.budget.length > 1 ? () => set("budget", d.budget.filter((x) => x.id !== b.id)) : undefined} />
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <AddButton onClick={() => set("budget", [...d.budget, { id: newId(), label: "", amount: "" }])}>＋ 項目を追加</AddButton>
        </div>
      </div>

      {total > 0 && (
        <div className="animate-rise grid gap-3 sm:grid-cols-3">
          <div className="bg-stone-50 p-4">
            <p className="text-xs text-stone-500">経費の合計</p>
            <p className="mt-1 font-en text-xl font-black">{formatYen(total)}</p>
          </div>
          <div className="bg-brand-soft p-4">
            <p className="text-xs text-brand">手数料{PLATFORM_FEE_RATE * 100}%込みで必要な目標</p>
            <p className="mt-1 font-en text-xl font-black text-brand">{formatYen(suggestedGoal)}</p>
            {d.goalType === "amount" && goal !== suggestedGoal && (
              <button type="button" onClick={() => set("goal", String(suggestedGoal))} className="mt-1 text-xs font-bold text-brand underline">
                目標金額に設定する
              </button>
            )}
          </div>
          <div className="bg-stone-50 p-4">
            <p className="text-xs text-stone-500">目標達成時に受け取れる額</p>
            <p className="mt-1 font-en text-xl font-black">{d.goalType === "amount" && goal > 0 ? formatYen(payoutAmount(goal)) : "—"}</p>
            {d.goalType === "amount" && goal > 0 && payoutAmount(goal) < total && <p className="mt-1 text-xs text-rose-600">経費に{formatYen(total - payoutAmount(goal))}足りません</p>}
          </div>
        </div>
      )}
      <p className="text-xs text-stone-500">リターンの原価や送料も、経費に入れ忘れないようにしましょう。</p>

      <div className="border-t border-stone-100 pt-5">
        <p className="text-sm font-medium">スケジュール</p>
        <ol className="mt-2 space-y-2">
          {d.schedule.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <input
                type="month"
                value={s.month}
                onChange={(e) => set("schedule", d.schedule.map((x) => (x.id === s.id ? { ...x, month: e.target.value } : x)))}
                className={`${inputClass} mt-0 w-40`}
                aria-label="時期"
              />
              <input
                value={s.label}
                onChange={(e) => set("schedule", d.schedule.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
                className={`${inputClass} mt-0 flex-1`}
                placeholder={["募集終了", "レコーディング", "リターンのお届け"][i % 3]}
                aria-label="内容"
              />
              <RowActions index={i} length={d.schedule.length} onMove={(from, to) => set("schedule", move(d.schedule, from, to))} onRemove={d.schedule.length > 1 ? () => set("schedule", d.schedule.filter((x) => x.id !== s.id)) : undefined} />
            </li>
          ))}
        </ol>
        <div className="mt-2">
          <AddButton onClick={() => set("schedule", [...d.schedule, { id: newId(), month: "", label: "" }])}>＋ 予定を追加</AddButton>
        </div>
        <button
          type="button"
          onClick={() => set("schedule", [...d.schedule].sort((a, b) => (a.month || "9999").localeCompare(b.month || "9999")))}
          className="mt-2 text-xs text-brand underline"
        >
          日付の順に並べ替える
        </button>
      </div>
    </>
  );
}

/* ───────── リターン ───────── */

const KIND_HINTS: Record<RewardKind, string> = {
  free: "支援者の母数を増やし、シェアのきっかけに。お礼のメッセージなど。",
  digital: "音源の先行配信・壁紙など。支払い完了後に自動でお届けします。",
  physical: "CD・レコード・グッズ。お届け先の住所を支援者に入力してもらいます。",
  ticket: "ライブチケット。公演の2週間前にQRチケットを自動発行します。",
  experience: "レコーディング見学など。日時・場所・人数を具体的に。",
  credit: "CDのブックレットやMVのエンドロールへの名前掲載。",
};

export function RewardsSection({ d, update }: SectionProps) {
  const set = setter(update);
  const [openId, setOpenId] = useState<string | null>(d.rewards[1]?.id ?? d.rewards[0]?.id ?? null);
  const setReward = (id: string, patch: Partial<DraftReward>) =>
    update((prev) => ({ ...prev, rewards: prev.rewards.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const prices = d.rewards.map((r) => toNumber(r.price)).filter((p) => p > 0);
  const hasMain = prices.some((p) => p >= 1500 && p <= 3000);

  return (
    <>
      <Tip>
        {REWARD_RECOMMENDED.min}〜{REWARD_RECOMMENDED.max}種類がおすすめ。主力は1,500〜3,000円です。金額は<strong>税込・送料込み</strong>で入力してください。
        {!hasMain && prices.length > 0 && " いま1,500〜3,000円のリターンがありません。いちばん選ばれる価格帯なので、1つ用意しましょう。"}
      </Tip>
      <ol className="space-y-3">
        {d.rewards.map((r, i) => {
          const open = openId === r.id;
          const problems = rewardProblems(r);
          return (
            <li key={r.id} className={`overflow-hidden rounded-lg border transition ${open ? "border-brand shadow-md" : "border-stone-200"}`}>
              <div className="flex items-center gap-2 p-3">
                <button type="button" onClick={() => setOpenId(open ? null : r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={`text-stone-400 transition ${open ? "rotate-90" : ""}`} aria-hidden>
                    ▶
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{r.title || "（リターン名未入力）"}</span>
                    <span className="block text-xs text-stone-500">
                      {r.kind === "free" ? "0円" : toNumber(r.price) > 0 ? formatYen(toNumber(r.price)) : "金額未入力"}・{REWARD_KIND_LABELS[r.kind]}
                      {r.limit && `・限定${r.limit}`}
                    </span>
                  </span>
                </button>
                {problems.length > 0 ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">未入力 {problems.length}</span>
                ) : (
                  <span className="shrink-0 text-emerald-600" aria-label="入力済み">
                    ✓
                  </span>
                )}
                <RowActions index={i} length={d.rewards.length} onMove={(from, to) => set("rewards", move(d.rewards, from, to))} />
              </div>
              {open && (
                <div className="animate-rise space-y-4 border-t border-stone-100 p-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <Field label="リターン名">
                      <input value={r.title} onChange={(e) => setReward(r.id, { title: e.target.value })} className={inputClass} placeholder="例: サイン入りCD＋音源の先行配信" />
                    </Field>
                    <Field label="金額（税込・送料込み）">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={r.kind === "free" ? "0" : r.price}
                        disabled={r.kind === "free"}
                        onChange={(e) => setReward(r.id, { price: e.target.value })}
                        className={`${inputClass} text-right disabled:bg-stone-100`}
                      />
                    </Field>
                  </div>
                  <Field label="種類" hint={KIND_HINTS[r.kind]}>
                    <select
                      value={r.kind}
                      onChange={(e) => {
                        const kind = e.target.value as RewardKind;
                        setReward(r.id, { kind, requiresShipping: kind === "physical" ? true : r.requiresShipping && kind !== "free" && kind !== "digital", price: kind === "free" ? "0" : r.price });
                      }}
                      className={inputClass}
                    >
                      {(Object.entries(REWARD_KIND_LABELS) as [RewardKind, string][]).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="内容の説明" hint="何が、いくつ、どんな形で届くのかを具体的に。CDなら曲数、グッズならサイズや色も。">
                    <textarea value={r.description} onChange={(e) => setReward(r.id, { description: e.target.value })} rows={3} className={inputClass} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="数量限定" optional hint="空欄なら無制限">
                      <input type="number" inputMode="numeric" min={1} value={r.limit} onChange={(e) => setReward(r.id, { limit: e.target.value })} className={inputClass} placeholder="無制限" />
                    </Field>
                    {r.kind !== "free" && (
                      <Field label="お届け予定" hint="製造・配送の準備期間も考えて">
                        <input type="month" value={r.deliveryMonth} onChange={(e) => setReward(r.id, { deliveryMonth: e.target.value })} className={inputClass} />
                      </Field>
                    )}
                    {(r.kind === "ticket" || r.kind === "experience") && (
                      <Field label={r.kind === "ticket" ? "公演日" : "有効期限"}>
                        <input type="date" value={r.validUntil} onChange={(e) => setReward(r.id, { validUntil: e.target.value })} className={inputClass} />
                      </Field>
                    )}
                  </div>
                  {r.kind !== "free" && r.kind !== "physical" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={r.requiresShipping} onChange={(e) => setReward(r.id, { requiresShipping: e.target.checked })} className="accent-brand" />
                      配送が必要（お届け先の住所を入力してもらう）
                    </label>
                  )}
                  <Field label="注意事項" optional hint="会場、年齢制限、転売禁止、キャンセル時の扱いなど。">
                    <textarea value={r.note} onChange={(e) => setReward(r.id, { note: e.target.value })} rows={2} className={inputClass} />
                  </Field>
                  <RewardImage reward={r} onChange={(image) => setReward(r.id, { image })} />
                  <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...r, id: newId(), title: `${r.title}（コピー）` };
                        set("rewards", [...d.rewards.slice(0, i + 1), copy, ...d.rewards.slice(i + 1)]);
                        setOpenId(copy.id);
                      }}
                      className="border border-stone-300 px-3 py-1.5 hover:bg-stone-100"
                    >
                      複製する
                    </button>
                    <button type="button" onClick={() => set("rewards", d.rewards.filter((x) => x.id !== r.id))} className="border border-stone-300 px-3 py-1.5 text-stone-500 hover:border-rose-300 hover:text-rose-600">
                      削除する
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <AddButton
        onClick={() => {
          const r = emptyReward("physical");
          set("rewards", [...d.rewards, r]);
          setOpenId(r.id);
        }}
      >
        ＋ リターンを追加
      </AddButton>
    </>
  );
}

function RewardImage({ reward, onChange }: { reward: DraftReward; onChange: (image: DraftImage | undefined) => void }) {
  return (
    <div className="text-sm">
      <p className="font-medium">
        リターンの画像<span className="ml-1.5 text-xs font-normal text-stone-400">任意</span>
      </p>
      {reward.image ? (
        <div className="mt-1 flex items-center gap-3">
          <img src={reward.image.url} alt="" className="h-20 w-28 object-cover" />
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-stone-500 hover:text-rose-600">
            画像を外す
          </button>
        </div>
      ) : (
        <label className="mt-1 inline-block cursor-pointer border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-100">
          画像を選ぶ
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const img = await toDraftImage(file);
              if (typeof img !== "string") onChange(img);
            }}
          />
        </label>
      )}
    </div>
  );
}

/* ───────── リスク・FAQ ───────── */

export function RisksSection({ d, update }: SectionProps) {
  const set = setter(update);
  return (
    <>
      <Field label="リスクとチャレンジ" hint="遅れる・中止になる可能性があること、そのときにどう知らせ、どう対応するかを正直に。書いてあるほど信頼されます。">
        <textarea value={d.risks} onChange={(e) => set("risks", e.target.value)} rows={5} className={inputClass} />
      </Field>
      {!d.risks.trim() && (
        <button type="button" onClick={() => set("risks", RISKS_TEMPLATE)} className="text-sm text-brand underline">
          文例を入れる
        </button>
      )}

      <div className="border-t border-stone-100 pt-5">
        <p className="text-sm font-medium">よくある質問</p>
        <p className="mt-1 text-xs text-stone-500">支援者から届きそうな質問に先に答えておくと、問い合わせが減り、迷っている人の後押しになります。</p>
        <ol className="mt-3 space-y-3">
          {d.faqs.map((f, i) => (
            <li key={f.id} className="animate-rise space-y-2 rounded-lg border border-stone-200 p-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand">Q</span>
                <input value={f.q} onChange={(e) => set("faqs", d.faqs.map((x) => (x.id === f.id ? { ...x, q: e.target.value } : x)))} className={`${inputClass} mt-0`} placeholder="質問" aria-label="質問" />
                <RowActions index={i} length={d.faqs.length} onMove={(from, to) => set("faqs", move(d.faqs, from, to))} onRemove={() => set("faqs", d.faqs.filter((x) => x.id !== f.id))} />
              </div>
              <div className="flex gap-2">
                <span className="pt-2 font-bold text-stone-400">A</span>
                <textarea value={f.a} onChange={(e) => set("faqs", d.faqs.map((x) => (x.id === f.id ? { ...x, a: e.target.value } : x)))} rows={2} className={`${inputClass} mt-0`} placeholder="回答" aria-label="回答" />
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-2">
          <AddButton onClick={() => set("faqs", [...d.faqs, { id: newId(), q: "", a: "" }])}>＋ 質問を追加</AddButton>
        </div>
      </div>
    </>
  );
}

/* ───────── 本人確認・振込先 ───────── */

export function IdentitySection({ d, update }: SectionProps) {
  const set = setter(update);
  // TODO: Stripe Connect の Express アカウント作成画面（Account Link）に飛ばし、戻ってきたら状態を取得する
  const steps = [
    { key: "identityVerified" as const, title: "本人確認", body: "運転免許証・マイナンバーカードなどの写真を提出します。確認が済むと「本人確認済み」のバッジが付きます。", action: "本人確認をはじめる" },
    { key: "bankRegistered" as const, title: "振込先口座の登録", body: "募集終了後、手数料を差し引いた金額をこの口座に振り込みます。", action: "口座を登録する" },
  ];
  return (
    <>
      <Tip>本人確認と振込先の登録は、決済サービス Stripe の画面で行います。OTOFUNDに身分証や口座の情報は保存されません。</Tip>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.key} className="flex flex-col gap-3 rounded-lg border border-stone-200 p-4 sm:flex-row sm:items-center">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold transition ${d[s.key] ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500"}`}>
              {d[s.key] ? "✓" : i + 1}
            </span>
            <div className="flex-1">
              <p className="font-bold">{s.title}</p>
              <p className="text-xs leading-relaxed text-stone-500">{s.body}</p>
            </div>
            {d[s.key] ? (
              <span className="text-sm font-bold text-emerald-600">完了</span>
            ) : (
              <button type="button" onClick={() => set(s.key, true)} className="bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-brand">
                {s.action}
              </button>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs text-stone-500">デモでは、ボタンを押すと完了した扱いになります。</p>
    </>
  );
}
