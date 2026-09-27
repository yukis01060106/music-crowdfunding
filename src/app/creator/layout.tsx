import type { Metadata } from "next";
import { DashboardShell } from "@/components/side-nav";

// TODO: 認証を入れたら proxy.ts で未ログインを /login にリダイレクトする
export const metadata: Metadata = { title: "実行者管理画面", robots: { index: false } };

const items = [
  { href: "/creator", label: "ダッシュボード" },
  { href: "/creator/projects/new", label: "プロジェクトを作成" },
  { href: "/creator/backers", label: "支援者一覧" },
  { href: "/creator/messages", label: "メッセージ" },
  { href: "/creator/updates", label: "活動報告" },
  { href: "/creator/shipping", label: "リターン配送" },
  { href: "/creator/payout", label: "入金・振込先" },
];

export default function CreatorLayout({ children }: LayoutProps<"/creator">) {
  return (
    <DashboardShell title="実行者管理画面" items={items}>
      {children}
    </DashboardShell>
  );
}
