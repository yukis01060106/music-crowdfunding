import { buttonClass } from "@/components/ui/button";
import Link from "next/link";

/** 運営画面の数字の箱 */
export function Kpi({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-en text-lg font-black">{value}</p>
      {note && <p className="mt-0.5 text-xs text-stone-500">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-stone-50 p-4 transition hover:bg-brand-soft">
      {body}
    </Link>
  ) : (
    <div className="bg-stone-50 p-4">{body}</div>
  );
}

/**
 * 表の外枠。スマホでは横にスクロールする。
 * relative にして、見出しの中の sr-only（absolute）がスクロールの外へはみ出し、ページ全体が横に動くのを防ぐ
 */
export function TableBox({ children, minWidth = 640, label }: { children: React.ReactNode; minWidth?: number; label: string }) {
  return (
    // 横にスクロールする領域は、キーボードでも動かせるよう tabIndex と名前を付ける
    <div role="region" aria-label={label} tabIndex={0} className="relative overflow-x-auto border border-stone-200 bg-white">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export const TH = "p-3 text-left text-xs font-medium text-stone-500";
export const TD = "p-3 align-top";

/** 見出し（h2）と、右側の補足 */
export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-bold">{children}</h2>
      {aside && <div className="text-xs text-stone-500">{aside}</div>}
    </div>
  );
}

/** デモであることの注記 */
export function DemoNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-8 border-l-4 border-stone-300 bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-600">{children}</p>;
}

/** 取り消しにくい操作の確定ボタン（ConfirmDialog の danger と同じ見た目） */
export const DANGER_BUTTON = buttonClass("danger");

/** ダイアログの下のボタンの並び（やめる／確定）。ConfirmDialog と同じ並びにする */
export function DialogActions({ onCancel, label, disabled, danger = false }: { onCancel: () => void; label: string; disabled?: boolean; danger?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
        やめる
      </button>
      <button type="submit" disabled={disabled} className={danger ? DANGER_BUTTON : buttonClass("primary")}>
        {label}
      </button>
    </div>
  );
}
