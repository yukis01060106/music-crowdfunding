"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = "[data-reveal], [data-stagger]";

/**
 * スクロール演出の司令塔。レイアウトに1つだけ置く。
 * data-reveal / data-stagger の要素が画面に入ったら is-shown を付ける。
 * サーバーコンポーネントでも属性を付けるだけで動くようにしている。
 */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("motion-ok");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-shown");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    const observe = (el: Element) => !el.classList.contains("is-shown") && io.observe(el);
    document.querySelectorAll(SELECTOR).forEach(observe);

    // あとから描画された要素（タブの切り替えなど）も拾う
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) observe(node);
          node.querySelectorAll(SELECTOR).forEach(observe);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return <div className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left scale-x-0 bg-gradient-to-r from-brand via-pop-pink to-pop-yellow" aria-hidden />;
}
