import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-en text-7xl font-black text-brand">404</p>
      <h1 className="mt-4 text-xl font-bold">ページが見つかりませんでした</h1>
      <p className="mt-2 text-sm text-stone-500">プロジェクトが終了したか、URLが変わった可能性があります。</p>
      <div className="mt-8 flex justify-center gap-3 text-sm">
        <Link href="/" className={buttonClass("primary")}>
          トップへ
        </Link>
        <Link href="/projects" className={buttonClass("secondary")}>
          プロジェクトをさがす
        </Link>
      </div>
    </div>
  );
}
