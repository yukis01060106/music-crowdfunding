"use client";

import Link from "next/link";

/** 予期しないエラーが起きたときの画面。再読み込みで直ることが多いので、まずやり直しを勧める */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-en text-5xl font-black text-brand">Oops</p>
      <h1 className="mt-4 text-xl font-bold">うまく表示できませんでした</h1>
      <p className="mt-2 text-sm text-stone-500">通信の状態によって起きることがあります。もう一度お試しください。</p>
      <div className="mt-8 flex justify-center gap-3 text-sm">
        <button type="button" onClick={reset} className="bg-ink px-5 py-2.5 font-bold text-white hover:bg-brand">
          もう一度読み込む
        </button>
        <Link href="/" className="border border-stone-300 bg-white px-5 py-2.5 hover:bg-stone-100">
          トップへ
        </Link>
      </div>
    </div>
  );
}
