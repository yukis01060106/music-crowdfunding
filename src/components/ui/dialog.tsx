"use client";

import { useId, useRef } from "react";
import { ICON, X } from "@/components/ui/icon";
import { createPortal } from "react-dom";
import { useHydrated } from "@/lib/demo-store";
import { useModal } from "@/lib/use-modal";
import { buttonClass } from "@/components/ui/button";

/**
 * モーダルダイアログ。body 直下に描画し、開いている間は背景を操作できなくする（useModal）。
 * Esc・背景のクリックで閉じる。
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const hydrated = useHydrated();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(open && hydrated, onClose, rootRef, panelRef);

  if (!hydrated || !open) return null;
  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm animate-fade sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`max-h-[90vh] w-full animate-rise overflow-y-auto bg-white p-6 shadow-2xl focus:outline-none ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold tracking-wider">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-ink">
            <X {...ICON} className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** はい・いいえの確認 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="text-sm leading-relaxed text-stone-600">{body}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className={buttonClass("secondary")}>
          やめる
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={buttonClass(danger ? "danger" : "primary")}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
