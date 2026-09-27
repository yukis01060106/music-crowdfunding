"use client";

import { useState } from "react";
import { ProofreadPanel } from "@/components/proofread/proofread-panel";

// TODO: 投稿は Supabase に保存し、公開後にプロジェクトページを再検証（revalidatePath）する
export function UpdateForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [backersOnly, setBackersOnly] = useState(false);
  const [posted, setPosted] = useState(false);

  if (posted) {
    return (
      <div className="animate-rise border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-bold text-emerald-800">活動報告を投稿しました</p>
        <button type="button" onClick={() => { setPosted(false); setTitle(""); setBody(""); }} className="mt-2 text-sm text-stone-600 underline">
          続けて投稿する
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim() && body.trim()) setPosted(true);
        }}
        className="space-y-4 border border-stone-200 bg-white p-5"
      >
        <label className="block text-sm">
          タイトル
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none" />
        </label>
        <label className="block text-sm">
          本文
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="mt-1 w-full rounded-lg border border-stone-300 p-3 leading-relaxed focus:border-brand focus:outline-none" />
          <span className="mt-1 block text-right text-xs text-stone-400">{body.length}文字</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={backersOnly} onChange={(e) => setBackersOnly(e.target.checked)} className="accent-brand" />
          支援者・メンバーだけに公開する（デモ音源の先行公開など）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked className="accent-brand" />
          支援者・お気に入り登録者にメールで通知する
        </label>
        <button type="submit" disabled={!title.trim() || !body.trim()} className="bg-brand px-6 py-2.5 font-bold text-white transition hover:bg-brand-dark disabled:bg-stone-300">
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
