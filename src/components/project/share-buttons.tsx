"use client";

import { useState } from "react";
import { assetPath } from "@/lib/asset-path";

/** シェアは支援の次に大きな「応援」。X・LINE・リンクコピーを用意する */
/** path を渡すとそのページを、省略すると今のページをシェアする */
export function ShareButtons({ title, path }: { title: string; path?: string }) {
  const [copied, setCopied] = useState(false);

  const pageUrl = () => (path ? `${window.location.origin}${assetPath(path)}` : window.location.href);

  function share(kind: "x" | "line") {
    const url = encodeURIComponent(pageUrl());
    const text = encodeURIComponent(`${title} を応援しています！`);
    const href =
      kind === "x"
        ? `https://x.com/intent/post?text=${text}&url=${url}`
        : `https://social-plugins.line.me/lineit/share?url=${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function copy() {
    await navigator.clipboard.writeText(pageUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const button = "flex-1 rounded-lg border border-stone-300 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50";
  return (
    <div>
      <p className="mb-2 text-xs text-stone-500">シェアして応援する</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => share("x")} className={button}>
          X
        </button>
        <button type="button" onClick={() => share("line")} className={button}>
          LINE
        </button>
        <button type="button" onClick={copy} className={button} aria-live="polite">
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>
      </div>
    </div>
  );
}
