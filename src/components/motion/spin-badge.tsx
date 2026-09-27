/**
 * 円に沿った文字がゆっくり回るバッジ。レコードのラベルのイメージ。
 * 置き場所は className で指定する（absolute など）。指定がなければ relative で流し込む。
 */
export function SpinBadge({
  text,
  center,
  size = 120,
  className = "",
  tone = "dark",
}: {
  text: string;
  center: React.ReactNode;
  size?: number;
  className?: string;
  tone?: "dark" | "light";
}) {
  const id = `spin-${text.length}-${size}`;
  const fg = tone === "dark" ? "fill-white" : "fill-ink";
  return (
    <div className={className || "relative"} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className={`${fg} font-en text-[9.5px] font-bold tracking-[0.2em]`}>
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-pop-yellow text-center font-en text-[11px] font-black leading-tight text-ink">
        {center}
      </div>
    </div>
  );
}
