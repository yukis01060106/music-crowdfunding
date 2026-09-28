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
    <nav aria-label={title} className="-mx-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-4 pb-2 md:mx-0 md:block md:space-y-1 md:border-0 md:p-0">
      <p className="mb-3 hidden px-3 text-xs font-bold uppercase tracking-wide text-stone-400 md:block">{title}</p>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`block shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
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
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:py-8">
      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
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
