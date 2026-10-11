/**
 * アイコン（lucide）。文字の記号（✓ ♡ ✕ →）の代わりに使う。
 * 決まり：文中は size-4、ボタンの中は size-5、線の太さは 2.25。飾りなので aria-hidden（意味は隣の文字で伝える）
 */
export {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CircleCheck,
  Flag,
  Heart,
  Link2,
  Lock,
  Menu,
  MessageCircle,
  Minus,
  Music2,
  PartyPopper,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";

/** 共通の属性（太さと読み上げの扱い） */
export const ICON = { strokeWidth: 2.25, "aria-hidden": true } as const;

/** X（旧 Twitter）のロゴ */
export function XLogo({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** LINE のロゴ（吹き出し） */
export function LineLogo({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5C6.2 2.5 1.5 6.3 1.5 11c0 4.2 3.7 7.7 8.8 8.4.3.1.8.2.9.5.1.3.1.7 0 1l-.2.9c-.1.3-.2 1 .9.6 1.1-.5 6-3.5 8.2-6.1 1.5-1.7 2.4-3.4 2.4-5.3 0-4.7-4.7-8.5-10.5-8.5Z" />
    </svg>
  );
}
