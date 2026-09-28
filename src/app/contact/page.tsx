import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "お問い合わせ" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-en text-xs tracking-wide text-stone-500">Contact</p>
      <h1 className="mt-1 text-2xl font-bold tracking-wider">お問い合わせ</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        送信の前に、<Link href="/help" className="text-brand underline">よくある質問</Link>もご覧ください。支援したプロジェクトのリターンについては、マイページのメッセージから実行者に直接お問い合わせいただくと早く解決します。
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
