"use client";

import { useState } from "react";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** 続報のお知らせを受け取る登録フォーム */
// TODO: Supabase に保存し、確認メールを送る
export function FesSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  if (done) {
    return (
      <p className="animate-rise bg-white/10 p-5 text-center font-bold tracking-wider">
        登録しました。続報を {email} にお届けします。
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isEmail(email)) {
          setError(true);
          return;
        }
        setDone(true);
      }}
      className="flex flex-col gap-2 sm:flex-row"
      noValidate
    >
      <label className="flex-1">
        <span className="sr-only">メールアドレス</span>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
          autoComplete="email"
          placeholder="メールアドレス"
          aria-invalid={error}
          className="w-full border-2 border-white/30 bg-transparent px-4 py-3.5 text-white placeholder:text-white/40 focus:border-pop-yellow focus:outline-none"
        />
        {error && <span className="mt-1 block text-xs text-pop-pink">メールアドレスを正しく入力してください</span>}
      </label>
      <button type="submit" className="group relative overflow-hidden bg-pop-yellow px-8 py-3.5 font-black tracking-wider text-ink transition hover:bg-white">
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/40" aria-hidden />
        続報を受け取る
      </button>
    </form>
  );
}
