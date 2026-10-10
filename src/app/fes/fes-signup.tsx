"use client";

import { useId, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** 続報のお知らせを受け取る登録フォーム */
// TODO: Supabase に保存し、確認メールを送る
export function FesSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  if (done) {
    return (
      <p className="animate-rise bg-white/10 p-5 text-center font-bold tracking-wider">
        登録しました。（デモ版）本番では続報を {email} にお届けします。
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isEmail(email)) {
          setError(true);
          inputRef.current?.focus();
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
          ref={inputRef}
          aria-invalid={error}
          aria-describedby={error ? errorId : undefined}
          className="w-full border-2 border-white/60 bg-transparent px-4 py-3.5 text-white placeholder:text-white/60 focus:border-pop-yellow focus:outline-none"
        />
        {error && (
          <span id={errorId} className="mt-1 block text-xs text-pop-pink">
            メールアドレスを正しく入力してください
          </span>
        )}
      </label>
      <button type="submit" className={buttonClass("onDark", "lg")}>
        続報を受け取る
      </button>
    </form>
  );
}
