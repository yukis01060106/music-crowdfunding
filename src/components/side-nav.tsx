"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

/** マイページ・管理画面・運営画面で共通のサイドナビ */
export function SideNav({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-stone-400">{title}</p>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm ${
              active ? "bg-brand-soft font-medium text-brand" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
      <aside>
        <SideNav title={title} items={items} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-6 text-2xl font-bold">{children}</h1>;
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
      {children}
    </div>
  );
}
