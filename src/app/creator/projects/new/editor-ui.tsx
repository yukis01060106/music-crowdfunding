"use client";

// 作成画面の部品。入力欄・並べ替えボタン・ファイル読み込み

export const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function Field({
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-stone-400">任意</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs leading-relaxed text-stone-500">{hint}</span>
      )}
    </label>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return <p className="bg-sky-50 p-3 text-sm leading-relaxed text-sky-900">{children}</p>;
}

/** 上へ・下へ・削除。並べ替えられるリストの行に付ける */
export function RowActions({
  index,
  length,
  onMove,
  onRemove,
  removeLabel = "削除",
}: {
  index: number;
  length: number;
  onMove: (from: number, to: number) => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const btn = "flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="上へ">
        ↑
      </button>
      <button type="button" className={btn} disabled={index === length - 1} onClick={() => onMove(index, index + 1)} aria-label="下へ">
        ↓
      </button>
      {onRemove && (
        <button type="button" className="rounded px-2 py-1.5 text-xs text-stone-500 hover:bg-rose-50 hover:text-rose-600" onClick={onRemove}>
          {removeLabel}
        </button>
      )}
    </div>
  );
}

export function AddButton({ onClick, children, disabled = false }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg border-2 border-dashed border-stone-300 py-2.5 text-sm text-stone-600 transition hover:border-brand hover:text-brand disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** 画像の縦横サイズを読む */
export function readImage(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

/** 音源の長さ（秒）を読む */
export function readAudio(file: File): Promise<{ url: string; durationSec: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve({ url, durationSec: Math.round(audio.duration) });
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("音源を読み込めませんでした"));
    };
    audio.src = url;
  });
}

export const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;
