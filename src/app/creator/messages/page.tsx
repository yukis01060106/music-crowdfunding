import { PageTitle } from "@/components/side-nav";
import { Inbox } from "./inbox";

// TODO: メッセージは Supabase に保存し、新着は Realtime で受け取る。支援者にはメールでも通知する
export default function CreatorMessagesPage() {
  return (
    <>
      <PageTitle>メッセージ</PageTitle>
      <p className="mb-4 text-sm text-stone-500">支援者からの質問には、2営業日以内の返信を目安にしましょう。よくある質問はプロジェクトのFAQに追加すると、問い合わせが減ります。</p>
      <Inbox />
    </>
  );
}
