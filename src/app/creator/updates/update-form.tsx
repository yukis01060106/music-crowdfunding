"use client";

import { useState } from "react";
import Link from "next/link";
import { ProofreadPanel } from "@/components/proofread/proofread-panel";
import { postUpdate } from "@/lib/demo-store";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { CREATOR_PROJECT_SLUG } from "../creator-context";

// TODO（本番）: 投稿は Supabase に保存し、公開後にプロジェクトページを再検証（revalidatePath）する。通知のメールは送信の予約に入れる
export function UpdateForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [backersOnly, setBackersOnly] = useState(false);
  const [posted, setPosted] = useState(false);

  if (posted) {
    return (
      <div role="status" className="animate-rise space-y-3 border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-bold text-emerald-800">活動報告を投稿しました</p>
        <p className="text-sm text-stone-600">プロジェクトの「活動報告」に載りました。{backersOnly ? "支援者だけが読めます。" : ""}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/projects/${CREATOR_PROJECT_SLUG}/updates`} className={buttonClass("primary", "md")}>
            公開されたページを見る
          </Link>
          <button
            type="button"
            onClick={() => {
              setPosted(false);
              setTitle("");
              setBody("");
              setBackersOnly(false);
            }}
            className={buttonClass("secondary", "md")}
          >
            続けて投稿する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !body.trim()) return;
          postUpdate({ projectSlug: CREATOR_PROJECT_SLUG, title: title.trim(), body: body.trim(), backersOnly });
          setPosted(true);
        }}
        className="space-y-4 border border-stone-200 bg-white p-5"
      >
        <label className="block text-sm">
          タイトル
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputClass} />
        </label>
        <label className="block text-sm">
          本文
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={5000} className={`${inputClass} leading-relaxed`} />
          <span className="mt-1 block text-right text-xs text-stone-500">{body.length}文字</span>
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={backersOnly} onChange={(e) => setBackersOnly(e.target.checked)} className="size-5 accent-brand" />
          支援者・メンバーだけに公開する（デモ音源の先行公開など）
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" defaultChecked className="size-5 accent-brand" />
          支援者・お気に入り登録者にメールで通知する
        </label>
        <button type="submit" disabled={!title.trim() || !body.trim()} className={buttonClass("primary", "lg")}>
          投稿する
        </button>
      </form>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <ProofreadPanel
          fields={[
            { id: "title", label: "タイトル", text: title },
            { id: "body", label: "本文", text: body },
          ].filter((f) => f.text.trim())}
          onApply={(fieldId, excerpt, replacement) => (fieldId === "title" ? setTitle((t) => t.replace(excerpt, replacement)) : setBody((b) => b.replace(excerpt, replacement)))}
        />
      </aside>
    </div>
  );
}
