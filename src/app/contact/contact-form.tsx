"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/lib/demo-store";

const CATEGORIES = ["支援について", "メンバーシップについて", "プロジェクトを立ち上げたい", "掲載中のプロジェクトの通報", "取材・提携", "その他"] as const;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const input = "mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none";

// TODO: 送信内容を Supabase に保存し、運営のメールと自動返信メールを送る
export function ContactForm() {
  const { user } = useDemo();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(CATEGORIES[0]);
  // 未入力のあいだはログイン中のアカウントの値を使う（null = まだ触っていない）
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [sent, setSent] = useState(false);

  const contactName = name ?? user?.name ?? "";
  const contactEmail = email ?? user?.email ?? "";
  const errors = {
    name: contactName.trim() ? null : "お名前を入力してください",
    email: isEmail(contactEmail) ? null : "メールアドレスを正しく入力してください",
    body: body.trim().length >= 10 ? null : "内容を10文字以上で入力してください",
    agreed: agreed ? null : "プライバシーポリシーへの同意が必要です",
  };

  if (sent) {
    return (
      <div className="animate-rise border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-3xl" aria-hidden>
          ✉️
        </p>
        <p className="mt-3 text-lg font-bold text-emerald-800">お問い合わせを受け付けました</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {contactEmail} に受付メールをお送りしました。
          <br />
          通常2営業日以内にお返事します。
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-stone-600 underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5 border border-stone-200 bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (Object.values(errors).some(Boolean)) {
          setShowErrors(true);
          return;
        }
        setSent(true);
      }}
    >
      <label className="block text-sm">
        お問い合わせの種類
        <select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])} className={`${input} border-stone-300`}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {category === "プロジェクトを立ち上げたい" && (
        <p className="animate-rise bg-brand-soft p-3 text-sm text-brand">
          掲載は無料です。まずは<Link href="/start" className="font-bold underline">アーティストの方へ</Link>のページもご覧ください。
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          お名前
          <input value={contactName} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={showErrors && Boolean(errors.name)} className={`${input} ${showErrors && errors.name ? "border-rose-500" : "border-stone-300"}`} />
          {showErrors && errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name}</span>}
        </label>
        <label className="block text-sm">
          メールアドレス
          <input type="email" value={contactEmail} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={showErrors && Boolean(errors.email)} className={`${input} ${showErrors && errors.email ? "border-rose-500" : "border-stone-300"}`} />
          {showErrors && errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email}</span>}
        </label>
      </div>
      <label className="block text-sm">
        内容
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={2000} aria-invalid={showErrors && Boolean(errors.body)} className={`${input} ${showErrors && errors.body ? "border-rose-500" : "border-stone-300"}`} placeholder="プロジェクト名や支援した日など、わかる範囲でご記入ください" />
        <span className="mt-1 flex justify-between text-xs">
          <span className="text-rose-600">{showErrors && errors.body}</span>
          <span className="text-stone-400">{body.length}/2000</span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-brand" />
        <span>
          <Link href="/legal/privacy" className="text-brand underline">
            プライバシーポリシー
          </Link>
          に同意して送信します
          {showErrors && errors.agreed && <span className="block text-xs text-rose-600">{errors.agreed}</span>}
        </span>
      </label>
      <button type="submit" className="w-full bg-ink py-3.5 font-bold tracking-wider text-white transition hover:bg-brand">
        送信する
      </button>
    </form>
  );
}
