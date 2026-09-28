import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_DOCS } from "@/lib/legal";
import { formatDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: LEGAL_DOCS.find((d) => d.slug === slug)?.title };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="法務ページ">
        {LEGAL_DOCS.map((d) => (
          <Link
            key={d.slug}
            href={`/legal/${d.slug}`}
            aria-current={d.slug === doc.slug ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${d.slug === doc.slug ? "border-ink bg-ink text-white" : "border-stone-300 bg-white hover:border-brand hover:text-brand"}`}
          >
            {d.title}
          </Link>
        ))}
      </nav>
      <h1 className="mt-8 text-2xl font-bold tracking-wider">{doc.title}</h1>
      <p className="mt-2 text-xs text-stone-500">最終更新日：{formatDate(doc.updatedAt)}</p>
      <p className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        この内容は公開前のたたき台です。サービス開始前に、弁護士など専門家の確認を受けた正式な本文に差し替えます。〔 〕の箇所は、運営会社の情報が決まりしだい記載します。
      </p>

      <div className="mt-10 space-y-10">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-3 border-l-4 border-brand pl-3 font-bold">{s.heading}</h2>
            {s.body.length > 1 && doc.slug === "privacy" ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700">
                {s.body.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3 text-sm leading-loose text-stone-700">
                {s.body.map((b, i) => (
                  <p key={b}>{s.body.length > 1 ? `${i + 1}. ${b}` : b}</p>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {doc.table && (
        <dl className="mt-10 divide-y divide-stone-200 border-y border-stone-200 text-sm">
          {doc.table.map((row) => (
            <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="font-bold">{row.label}</dt>
              <dd className="leading-relaxed text-stone-700">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-12 text-sm text-stone-600">
        ご不明な点は<Link href="/contact" className="text-brand underline">お問い合わせ</Link>ください。
      </p>
    </div>
  );
}
