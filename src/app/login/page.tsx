import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";

export const metadata: Metadata = { title: "ログイン", robots: { index: false } };

/** 左に写真のコラージュ、右にフォーム。スマホではフォームだけ */
const PHOTOS = [
  { src: "/images/ukulele-pink.jpg", className: "left-6 top-10 rotate-[-6deg] border-pop-yellow" },
  { src: "/images/vinyl-purple.jpg", className: "left-1/2 top-24 z-10 -translate-x-1/2 rotate-[3deg] border-pop-pink" },
  { src: "/images/guitar-beach.jpg", className: "right-6 top-44 rotate-[7deg] border-pop-teal" },
];

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:min-h-[70vh] lg:grid-cols-2 lg:items-center lg:py-16">
      <div className="relative hidden h-[520px] overflow-hidden bg-brand lg:block" aria-hidden>
        {PHOTOS.map((p) => (
          <div key={p.src} className={`absolute aspect-[3/4] w-48 overflow-hidden border-[3px] bg-brand-soft shadow-sticker ${p.className}`}>
            <Photo src={p.src} alt="" sizes="192px" />
          </div>
        ))}
        <Sticker shape="circle" color="yellow" size={72} className="-right-4 -top-4" float />
        <Sticker shape="triangle" color="pink" size={40} className="bottom-28 left-10" />
        <p className="absolute inset-x-0 bottom-8 px-8 text-2xl font-black leading-snug tracking-[0.1em] text-white">
          “好き”を
          <br />
          “次の一歩”に。
        </p>
      </div>
      <div className="mx-auto w-full max-w-sm">
        <p className="inline-flex items-center gap-2 font-en text-xs font-bold uppercase tracking-[0.2em] text-brand">
          <span className="size-2 bg-pop-yellow" aria-hidden />
          Login
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[0.1em] sm:text-3xl">ログイン・会員登録</h1>
        <p className="mt-2 text-sm text-stone-600">パスワードはいりません。メールアドレスだけで始められます。</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
