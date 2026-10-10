import type { Metadata } from "next";
import { PageTitle } from "@/components/side-nav";
import { ReviewQueue } from "../review-queue";
import { REVIEW_QUEUE } from "../admin-data";

export const metadata: Metadata = { title: "審査" };

export default function AdminReviewPage() {
  return (
    <>
      <PageTitle>審査</PageTitle>
      <p className="mb-6 text-sm text-stone-600">審査の結果は、5営業日ほどを目安に実行者へ知らせます。差し戻すときは、直してほしい点を具体的に書きます。</p>
      <ReviewQueue items={REVIEW_QUEUE} />
    </>
  );
}
