import type { Metadata } from "next";
import { DashboardShell } from "@/components/side-nav";

// TODO: 運営ロールのユーザーだけがアクセスできるようにする
export const metadata: Metadata = { title: "運営管理", robots: { index: false } };

const items = [{ href: "/admin", label: "審査と運営状況" }];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <DashboardShell title="運営管理" items={items}>
      {children}
    </DashboardShell>
  );
}
