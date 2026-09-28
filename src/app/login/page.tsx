import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "ログイン", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <p className="text-center font-en text-xs tracking-wide text-stone-500">Login</p>
      <h1 className="mt-1 text-center text-2xl font-bold tracking-wider">ログイン・会員登録</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
