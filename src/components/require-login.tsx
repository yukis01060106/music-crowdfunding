"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { login, useDemo, useHydrated } from "@/lib/demo-store";

/**
 * ログインが必要な画面の中身を包む。未ログインならログインへの案内を出す。
 * TODO: Supabase Auth を入れたら、proxy.ts でサーバー側でもリダイレクトする
 */
export function RequireLogin({ children, what = "この画面" }: { children: React.ReactNode; what?: string }) {
  const { user } = useDemo();
  const hydrated = useHydrated();
  const pathname = usePathname();

  if (!hydrated) return <div className="h-64 animate-pulse bg-stone-100" aria-label="読み込み中" />;
  if (user) return <>{children}</>;

  return (
    <div className="animate-rise border border-stone-200 bg-white p-8 text-center">
      <p className="text-3xl" aria-hidden>
        🔒
      </p>
      <p className="mt-3 font-bold">{what}を見るには、ログインしてください</p>
      <p className="mt-1 text-sm text-stone-500">メールアドレスだけで、パスワードなしでログインできます。</p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="bg-ink px-8 py-3 font-bold tracking-wider text-white transition hover:bg-brand">
          ログイン・会員登録
        </Link>
        <button type="button" onClick={() => login({ name: "音楽好きのゆう", email: "yu@example.com", provider: "email" })} className="text-sm text-brand underline">
          （デモ）デモ用のアカウントでログイン
        </button>
      </div>
    </div>
  );
}
