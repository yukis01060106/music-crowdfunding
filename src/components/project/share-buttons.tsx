"use client";

import { useState, useSyncExternalStore } from "react";
import { assetPath } from "@/lib/asset-path";

const noop = () => () => {};
/** スマホなど、OS の共有メニュー（navigator.share）が使えるか */
const useCanShare = () => useSyncExternalStore(noop, () => typeof navigator !== "undefined" && typeof navigator.share === "function", () => false);

/**
 * シェアは支援の次に大きな「応援」。スマホでは OS の共有メニュー（Instagram・TikTok などにも送れる）を先頭に出し、
 * X・LINE・リンクのコピーも用意する。path を渡すとそのページを、省略すると今のページをシェアする。
 */
export function ShareButtons({ title, path }: { title: string; path?: string }) {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const canShare = useCanShare();

  const pageUrl = () => (path ? `${window.location.origin}${assetPath(path)}` : window.location.href);
  const text = `${title} を応援しています！`;

  function share(kind: "x" | "line") {
    const url = encodeURIComponent(pageUrl());
    const href = kind === "x" ? `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${url}` : `https://social-plugins.line.me/lineit/share?url=${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url: pageUrl() });
    } catch {
      // 共有メニューを閉じただけのときも、ここに来る
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // アプリ内ブラウザなどでコピーできないときは、URL を表示して長押しでコピーしてもらう
      setFallbackUrl(pageUrl());
    }
  }

  const button = "flex min-h-11 flex-1 items-center justify-center border-2 border-ink bg-white text-xs font-bold text-ink transition hover:bg-ink hover:text-white";
  return (
    <div>
      <p className="mb-2 text-xs text-stone-500">シェアして応援する</p>
      {canShare && (
        <button type="button" onClick={nativeShare} className="mb-2 flex min-h-11 w-full items-center justify-center gap-2 bg-ink text-sm font-bold text-white transition hover:bg-brand">
          <span aria-hidden>↗</span> シェアする
        </button>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => share("x")} className={button}>
          X
        </button>
        <button type="button" onClick={() => share("line")} className={button}>
          LINE
        </button>
        <button type="button" onClick={copy} className={button}>
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "リンクをコピーしました" : ""}
      </p>
      {fallbackUrl && (
        <label className="mt-2 block text-xs text-stone-600">
          コピーできませんでした。下の URL を長押ししてコピーしてください。
          <input readOnly value={fallbackUrl} onFocus={(e) => e.currentTarget.select()} className="mt-1 w-full border border-stone-500 bg-white px-2 py-2 text-xs" />
        </label>
      )}
    </div>
  );
}
