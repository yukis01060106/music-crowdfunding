/** 画面の両端に引く細い線と、縦に流れる英字。広い画面だけに出す */
export function SideRails() {
  const text = "MUSIC CROWDFUNDING OTOFUND · ".repeat(12);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-y-0 left-0 right-0 z-30 hidden 2xl:block">
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          className={`absolute inset-y-0 ${side === "left" ? "left-0 border-r" : "right-0 border-l"} w-7 overflow-hidden border-ink bg-white`}
        >
          <div className={`${side === "left" ? "animate-marquee-up" : "animate-marquee-down"} flex flex-col items-center`}>
            {[0, 1].map((i) => (
              <p
                key={i}
                className="whitespace-nowrap py-2 font-en text-[10px] tracking-wide text-ink"
                style={{ writingMode: "vertical-rl" }}
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
