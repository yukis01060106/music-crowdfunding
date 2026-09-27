import { PageTitle } from "@/components/side-nav";
import { UpdateForm } from "./update-form";

export default function CreatorUpdatesPage() {
  return (
    <>
      <PageTitle>活動報告を投稿</PageTitle>
      <p className="mb-4 text-sm text-stone-500">募集中は週1回以上の更新がおすすめです。制作の様子が伝わるほど、支援者の安心と新しい支援につながります。</p>
      <UpdateForm />
    </>
  );
}
