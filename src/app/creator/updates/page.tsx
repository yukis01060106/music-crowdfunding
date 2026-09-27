import { PageTitle } from "@/components/side-nav";

// TODO: 投稿は Supabase に保存し、公開後にプロジェクトページを再検証（revalidatePath）する
export default function CreatorUpdatesPage() {
  return (
    <>
      <PageTitle>活動報告を投稿</PageTitle>
      <form className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <label className="block text-sm">
          タイトル
          <input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          本文
          <textarea rows={8} className="mt-1 w-full rounded-lg border border-stone-300 p-3" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-brand" />
          支援者だけに公開する（デモ音源の先行公開など）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked className="accent-brand" />
          支援者・お気に入り登録者にメールで通知する
        </label>
        <button type="button" className="rounded-lg bg-brand px-5 py-2 font-medium text-white">
          投稿する
        </button>
      </form>
    </>
  );
}
