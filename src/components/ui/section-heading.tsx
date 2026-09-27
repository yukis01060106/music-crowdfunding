import Link from "next/link";

/** 小さな英字ラベル＋字間を広げた日本語見出し */
export function SectionHeading({
  en,
  ja,
  lead,
  dark = false,
}: {
  en: string;
  ja: string;
  lead?: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p className={`font-en text-xs font-medium tracking-wide ${dark ? "text-white/70" : "text-stone-500"}`}>{en}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-[0.12em] sm:text-3xl">{ja}</h2>
      {lead && <p className={`mt-3 text-sm ${dark ? "text-white/80" : "text-stone-600"}`}>{lead}</p>}
    </div>
  );
}

const CIRCLE: Record<"teal" | "blue" | "purple" | "pink", string> = {
  teal: "bg-pop-teal",
  blue: "bg-pop-blue",
  purple: "bg-brand",
  pink: "bg-pop-pink",
};

/** 色付きの丸に文字が重なる「View more」 */
export function CircleLink({
  href,
  children = "View more",
  color = "teal",
  dark = false,
}: {
  href: string;
  children?: React.ReactNode;
  color?: keyof typeof CIRCLE;
  dark?: boolean;
}) {
  return (
    <Link href={href} className="group relative inline-flex h-20 items-center pr-4">
      <span
        className={`absolute right-0 h-20 w-20 rounded-full ${CIRCLE[color]} transition-transform group-hover:scale-110`}
        aria-hidden
      />
      <span className={`relative font-en text-sm font-medium ${dark ? "text-white" : "text-ink"}`}>
        {children} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
