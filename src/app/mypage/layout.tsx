import type { Metadata } from "next";
import { DashboardShell } from "@/components/side-nav";

// TODO: 認証を入れたら proxy.ts で未ログインを /login にリダイレクトする
export const metadata: Metadata = { title: "マイページ", robots: { index: false } };

const items = [
  { href: "/mypage", label: "支援したプロジェクト" },
  { href: "/mypage/favorites", label: "お気に入り" },
  { href: "/mypage/messages", label: "メッセージ" },
  { href: "/mypage/settings", label: "アカウント設定" },
];

export default function MyPageLayout({ children }: LayoutProps<"/mypage">) {
  return (
    <DashboardShell title="マイページ" items={items}>
      {children}
    </DashboardShell>
  );
}
