/** 大きな英字が横に流れ続ける帯。セクションの区切りに使う */
export function TextMarquee({ words, tone = "ink" }: { words: string[]; tone?: "ink" | "brand" | "yellow" }) {
  const styles = {
    ink: "bg-ink text-white",
    brand: "bg-brand text-white",
    yellow: "bg-pop-yellow text-ink",
  }[tone];
  const line = [...words, ...words];
  return (
    <div className={`overflow-hidden py-4 ${styles}`} aria-hidden>
      <div className="flex w-max animate-marquee-left gap-10 whitespace-nowrap font-en text-4xl font-black tracking-tight sm:text-6xl">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-10">
            {line.map((w, i) => (
              <span key={`${copy}-${i}`} className="flex items-center gap-10">
                <span className={i % 2 === 1 ? "text-transparent [-webkit-text-stroke:1.5px_currentColor]" : ""}>{w}</span>
                <span className="text-pop-pink">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
