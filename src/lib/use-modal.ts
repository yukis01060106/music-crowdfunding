"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * モーダル（ダイアログ・全画面メニュー・プレビュー）の共通の振る舞い。
 * 開いている間は、背景のスクロールを止め、背景を inert にしてフォーカスが外へ抜けないようにする。
 * Esc で閉じ、閉じたら開く前の要素へフォーカスを戻す。
 *
 * container は body 直下に描画した要素（ポータル）。onClose は毎回作り直されても effect を張り直さないよう ref で持つ
 * （張り直すと、入力のたびにフォーカスが飛ぶ）。
 */
export function useModal(open: boolean, onClose: () => void, container: RefObject<HTMLElement | null>, initialFocus?: RefObject<HTMLElement | null>) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const root = container.current;
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // body 直下のほかの要素を操作できなくする（フォーカスも読み上げも届かない）
    // お知らせ（トースト）は読み上げが止まらないよう、data-modal-keep を付けて対象から外す
    const others = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== root && !el.contains(root) && !el.inert && !el.hasAttribute("data-modal-keep"),
    );
    others.forEach((el) => (el.inert = true));

    (initialFocus?.current ?? root)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      others.forEach((el) => (el.inert = false));
      window.removeEventListener("keydown", onKey);
      // 開いたボタンが消えていたら（承認した行・削除した行など）、本文の先頭へ戻す
      if (opener?.isConnected) opener.focus();
      else document.getElementById("main")?.focus();
    };
  }, [open, container, initialFocus]);
}
