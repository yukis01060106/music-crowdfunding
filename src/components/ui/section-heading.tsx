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
    <div data-reveal="up">
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

/** 文字の横に、矢印の入った色付きの丸を置く「View more」。文字は丸に重ねない（読みやすさのため） */
const ARROW_ON: Record<keyof typeof CIRCLE, string> = {
  teal: "text-ink",
  blue: "text-white",
  purple: "text-white",
  pink: "text-ink",
};

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
    <Link href={href} className={`group inline-flex min-h-11 items-center gap-3 font-en text-sm font-bold tracking-wide ${dark ? "text-white" : "text-ink"}`}>
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${CIRCLE[color]} ${ARROW_ON[color]} text-lg transition-transform group-hover:translate-x-1 group-hover:scale-110`}
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
