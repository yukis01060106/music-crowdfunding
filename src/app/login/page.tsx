import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ログイン", robots: { index: false } };

// TODO: Supabase Auth（メールのマジックリンク＋Google/X）に置き換える
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-center text-2xl font-bold">ログイン・会員登録</h1>
      <form className="mt-8 space-y-4">
        <label className="block text-sm">
          メールアドレス
          <input type="email" autoComplete="email" required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <button type="button" className="w-full rounded-lg bg-brand py-3 font-bold text-white">
          ログインリンクを送る
        </button>
      </form>
      <div className="my-6 text-center text-xs text-stone-400">または</div>
      <div className="space-y-2">
        <button type="button" className="w-full rounded-lg border border-stone-300 bg-white py-2.5 text-sm">Googleで続ける</button>
        <button type="button" className="w-full rounded-lg border border-stone-300 bg-white py-2.5 text-sm">Xで続ける</button>
      </div>
      <p className="mt-6 text-center text-xs text-stone-500">
        続けることで<Link href="/legal/terms" className="underline">利用規約</Link>と
        <Link href="/legal/privacy" className="underline">プライバシーポリシー</Link>に同意したものとみなします。
      </p>
    </div>
  );
}
