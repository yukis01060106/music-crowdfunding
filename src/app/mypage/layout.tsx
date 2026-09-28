import type { Metadata } from "next";
import { DashboardShell } from "@/components/side-nav";
import { RequireLogin } from "@/components/require-login";

export const metadata: Metadata = { title: "マイページ", robots: { index: false } };

const items = [
  { href: "/mypage", label: "支援したプロジェクト" },
  { href: "/mypage/membership", label: "メンバーシップ" },
  { href: "/mypage/favorites", label: "お気に入り" },
  { href: "/mypage/messages", label: "メッセージ" },
  { href: "/mypage/settings", label: "アカウント設定" },
];

export default function MyPageLayout({ children }: LayoutProps<"/mypage">) {
  return (
    <DashboardShell title="マイページ" items={items}>
      <RequireLogin what="マイページ">{children}</RequireLogin>
    </DashboardShell>
  );
}
