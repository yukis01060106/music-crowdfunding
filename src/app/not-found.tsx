import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-xl font-bold">ページが見つかりませんでした</h1>
      <p className="mt-2 text-sm text-stone-500">プロジェクトが終了したか、URLが変わった可能性があります。</p>
      <div className="mt-8 flex justify-center gap-3 text-sm">
        <Link href="/" className="rounded-full bg-brand px-5 py-2.5 font-medium text-white">
          トップへ
        </Link>
        <Link href="/projects" className="rounded-full border border-stone-300 bg-white px-5 py-2.5">
          プロジェクトをさがす
        </Link>
      </div>
    </div>
  );
}
