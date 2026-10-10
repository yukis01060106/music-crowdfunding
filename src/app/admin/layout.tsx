import type { Metadata } from "next";
import { DashboardShell } from "@/components/side-nav";

// TODO（本番）: 運営ロールの確認は、layout だけで行わない（layout はページの移動で再描画されず、子のページやデータ取得は動いてしまう）。
//   DAL の requireAdmin() を、各 page・各データ取得・各 Server Action / Route Handler の中で毎回呼ぶ。
//   Supabase の RLS でも role = 'admin' を必須にし、ロールは JWT の app_metadata など本人が書き換えられない場所に置く。
// 子のページでは robots を上書きしない（ここで管理画面全体を検索結果に出さない）
export const metadata: Metadata = { title: "運営管理", robots: { index: false, follow: false, nocache: true } };

const items = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/review", label: "審査" },
  { href: "/admin/projects", label: "プロジェクト" },
  { href: "/admin/payments", label: "お金の流れ" },
  { href: "/admin/users", label: "ユーザー" },
  { href: "/admin/inbox", label: "問い合わせ・通報" },
  { href: "/admin/fes", label: "ONE NOTE FES" },
  { href: "/admin/logs", label: "操作の記録" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <DashboardShell title="運営管理" items={items}>
      {children}
    </DashboardShell>
  );
}
