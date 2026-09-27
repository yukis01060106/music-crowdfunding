import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getArtist, getArtists } from "@/lib/data";
import { withMembership } from "@/lib/membership";
import { JoinFlow } from "./join-flow";

export const metadata: Metadata = { title: "メンバーになる", robots: { index: false } };

// 画面の枠だけを静的生成し、選択中のプラン（?plan=）はブラウザ側で読む
export async function generateStaticParams() {
  return withMembership(await getArtists()).map((a) => ({ id: a.id }));
}

export default async function JoinPage({ params }: PageProps<"/artists/[id]/join">) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist?.membership) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/artists/${artist.id}#membership`} className="text-sm text-stone-500 hover:text-brand">
        ← {artist.name}のページに戻る
      </Link>
      <h1 className="mt-2 text-xl font-bold leading-snug">{artist.name}のメンバーになる</h1>
      <Suspense>
        <JoinFlow artistId={artist.id} artistName={artist.name} plans={artist.membership.plans} />
      </Suspense>
    </div>
  );
}
