"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export interface MenuItem {
  href: string;
  label: string;
  en: string;
}

const SUB_LINKS = [
  { href: "/creator", label: "実行者管理画面" },
  { href: "/help", label: "よくある質問" },
  { href: "/legal/terms", label: "利用規約" },
];

// ポータルの描画先（document.body）はブラウザにしかないので、描画後に使う
const subscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);

/**
 * スマホ用の全画面メニュー。
 * ヘッダーは backdrop-blur で固定配置の基準になってしまうため、本体は body 直下にポータルで描画する。
 * 開いている間は背景のスクロールを止め、リンク・ページ移動・Esc・画面幅の拡大で閉じる。
 */
export function MobileMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isClient = useIsClient();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // ページを移ったら閉じる
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    const toggle = toggleRef.current;
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      toggle?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="メニューを開く"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition active:scale-95 md:hidden"
      >
        <BurgerIcon open={false} />
      </button>

      {isClient &&
        createPortal(
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="メニュー"
            aria-hidden={!open}
            inert={!open}
            className={`fixed inset-0 z-[70] flex flex-col bg-ink text-white transition-[opacity,visibility] duration-300 md:hidden ${
              open ? "visible opacity-100" : "invisible opacity-0"
            }`}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <Link href="/" onClick={close} className="font-en text-2xl font-black tracking-tight" aria-label="OTOFUND トップへ">
                OTOFUND
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="メニューを閉じる"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-95"
              >
                <BurgerIcon open />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 pb-10 pt-4" aria-label="メインメニュー">
              <ul className="space-y-1">
                {items.map((item, i) => {
                  const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li
                      key={item.href}
                      className={`transition duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                      style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
                    >
                      <Link
                        ref={i === 0 ? firstLinkRef : undefined}
                        href={item.href}
                        onClick={close}
                        aria-current={current ? "page" : undefined}
                        className="group flex items-baseline justify-between border-b border-white/10 py-4"
                      >
                        <span>
                          <span className="block font-en text-[11px] tracking-wide text-white/50">{item.en}</span>
                          <span className={`mt-0.5 block text-xl font-bold tracking-wider ${current ? "text-pop-yellow" : ""}`}>{item.label}</span>
                        </span>
                        <span className="text-white/40 transition-transform group-active:translate-x-1" aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div
                className={`mt-8 grid grid-cols-2 gap-3 transition duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                style={{ transitionDelay: open ? `${80 + items.length * 60}ms` : "0ms" }}
              >
                <Link href="/login" onClick={close} className="bg-white py-3.5 text-center font-bold tracking-wider text-ink">
                  ログイン
                </Link>
                <Link href="/mypage" onClick={close} className="border border-white/40 py-3.5 text-center font-bold tracking-wider">
                  マイページ
                </Link>
              </div>

              <Link
                href="/fes"
                onClick={close}
                className={`mt-6 block bg-gradient-to-r from-brand to-pop-pink p-5 transition duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                style={{ transitionDelay: open ? `${140 + items.length * 60}ms` : "0ms" }}
              >
                <span className="inline-block bg-pop-yellow px-2 py-0.5 text-[10px] font-black tracking-widest text-ink">企画中</span>
                <span className="mt-2 block font-en text-2xl font-black">ONE NOTE FES</span>
                <span className="mt-1 block text-sm text-white/85">ファンと共に創るフェス →</span>
              </Link>

              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
                {SUB_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={close} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}

/** ☰ と × を切り替えるアイコン */
function BurgerIcon({ open }: { open: boolean }) {
  const bar = "absolute left-0 h-0.5 w-5 rounded bg-current transition duration-300";
  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <span className={`${bar} ${open ? "top-1.5 rotate-45" : "top-0"}`} />
      <span className={`${bar} top-1.5 ${open ? "opacity-0" : ""}`} />
      <span className={`${bar} ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
    </span>
  );
}
