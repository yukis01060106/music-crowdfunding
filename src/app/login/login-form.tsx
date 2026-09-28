"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { login, type DemoUser } from "@/lib/demo-store";
import { toast } from "@/components/ui/toast";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// TODO: Supabase Auth（メールのマジックリンク＋Google/X）に置き換える
export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/mypage";
  // 外部サイトへ飛ばされないよう、サイト内のパスだけを受け付ける
  const redirectTo = next.startsWith("/") && !next.startsWith("//") ? next : "/mypage";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  function finish(user: DemoUser) {
    login(user);
    toast(`${user.name}さん、ようこそ`);
    router.push(redirectTo);
  }

  if (sent) {
    return (
      <div className="animate-rise mt-8 space-y-4 text-center">
        <p className="text-4xl" aria-hidden>
          ✉️
        </p>
        <p className="font-bold">{email} にログインリンクを送りました</p>
        <p className="text-sm leading-relaxed text-stone-600">メールのリンクを開くと、ログインが完了します。リンクの有効期限は1時間です。</p>
        <button type="button" onClick={() => finish({ name: email.split("@")[0], email, provider: "email" })} className="w-full bg-brand py-3 font-bold text-white transition hover:bg-brand-dark">
          （デモ）リンクを開いたことにしてログイン
        </button>
        <button type="button" onClick={() => setSent(false)} className="text-sm text-stone-500 underline">
          メールアドレスを入力し直す
        </button>
      </div>
    );
  }

  return (
    <>
      <form
        className="mt-8 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!isEmail(email)) {
            setError(true);
            return;
          }
          setSent(true);
        }}
      >
        <label className="block text-sm">
          メールアドレス
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(false);
            }}
            aria-invalid={error}
            className={`mt-1 w-full rounded-lg border px-3 py-2.5 focus:border-brand focus:outline-none ${error ? "border-rose-500" : "border-stone-300"}`}
          />
          {error && <span className="mt-1 block text-xs text-rose-600">メールアドレスを正しく入力してください</span>}
        </label>
        <button type="submit" className="w-full bg-brand py-3 font-bold text-white transition hover:bg-brand-dark">
          ログインリンクを送る
        </button>
        <p className="text-center text-xs text-stone-500">パスワードは不要です。はじめての方は、そのまま会員登録になります。</p>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        または
        <span className="h-px flex-1 bg-stone-200" />
      </div>
      <div className="space-y-2">
        <button type="button" onClick={() => finish({ name: "音楽好きのゆう", email: "yu@example.com", provider: "google" })} className="flex w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 text-sm font-medium transition hover:bg-stone-50">
          <span className="font-en font-black text-[#4285f4]" aria-hidden>
            G
          </span>
          Googleで続ける
        </button>
        <button type="button" onClick={() => finish({ name: "radio_listener", email: "listener@example.com", provider: "x" })} className="flex w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 text-sm font-medium transition hover:bg-stone-50">
          <span className="font-en font-black" aria-hidden>
            𝕏
          </span>
          Xで続ける
        </button>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-stone-500">
        続けることで<Link href="/legal/terms" className="underline">利用規約</Link>と
        <Link href="/legal/privacy" className="underline">プライバシーポリシー</Link>に同意したものとみなします。
      </p>
    </>
  );
}
