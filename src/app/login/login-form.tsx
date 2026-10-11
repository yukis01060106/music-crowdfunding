"use client";

import Link from "next/link";
import { XLogo } from "@/components/ui/icon";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { login, type DemoUser } from "@/lib/demo-store";
import { toast } from "@/components/ui/toast";
import { safeNext } from "@/lib/safe-redirect";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// TODO: Supabase Auth（メールのマジックリンク＋Google/X）に置き換える
export function LoginForm() {
  const router = useRouter();
  // 外部サイトへ飛ばされないよう、サイト内のパスだけを受け付ける
  const redirectTo = safeNext(useSearchParams().get("next"));
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
        <p className="font-bold">（デモ版）本番では {email} にログインリンクが届きます</p>
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
            className={`mt-1 w-full border px-3 py-2.5 focus:border-brand focus:outline-none ${error ? "border-rose-500" : "border-stone-500"}`}
          />
          {error && <span className="mt-1 block text-xs text-rose-600">メールアドレスを正しく入力してください</span>}
        </label>
        <button type="submit" className="w-full bg-brand py-3 font-bold text-white transition hover:bg-brand-dark">
          ログインリンクを送る
        </button>
        <p className="text-center text-xs text-stone-500">パスワードは不要です。はじめての方は、そのまま会員登録になります。</p>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-stone-500">
        <span className="h-px flex-1 bg-stone-200" />
        または
        <span className="h-px flex-1 bg-stone-200" />
      </div>
      <div className="space-y-2">
        <button type="button" onClick={() => finish({ name: "音楽好きのゆう", email: "yu@example.com", provider: "google" })} className="flex min-h-11 w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 text-sm font-medium transition hover:bg-stone-50">
          <GoogleLogo />
          Googleで続ける
        </button>
        <button type="button" onClick={() => finish({ name: "radio_listener", email: "listener@example.com", provider: "x" })} className="flex min-h-11 w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 text-sm font-medium transition hover:bg-stone-50">
          <XLogo className="size-4" />
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

/** Google のロゴ（4色の G） */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
