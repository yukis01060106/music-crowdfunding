import Link from "next/link";
import { GENRE_LABELS, type Genre } from "@/types";

export function GenreNav({ current }: { current?: Genre }) {
  const base = "rounded-full border px-3 py-1 text-sm";
  return (
    <nav className="my-6 flex flex-wrap gap-2">
      <Link
        href="/projects"
        className={`${base} ${current ? "border-stone-300 bg-white" : "border-brand bg-brand text-white"}`}
      >
        すべて
      </Link>
      {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
        <Link
          key={g}
          href={`/genres/${g}`}
          className={`${base} ${current === g ? "border-brand bg-brand text-white" : "border-stone-300 bg-white"}`}
        >
          {GENRE_LABELS[g]}
        </Link>
      ))}
    </nav>
  );
}
