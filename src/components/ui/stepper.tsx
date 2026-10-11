import { Check, ICON } from "./icon";

/**
 * 手順の表示（丸い番号を線でつなぐ）。終わった手順はチェック、今の手順は紫で強調する。
 * 読み上げでは「完了」「現在」を伝える
 */
export function Stepper({ labels, current, label }: { labels: string[]; current: number; label: string }) {
  return (
    <ol className="flex items-start" aria-label={label}>
      {labels.map((text, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={text} aria-current={now ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
            {/* 前の手順とつなぐ線 */}
            {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 ${i <= current ? "bg-brand" : "bg-stone-300"}`} aria-hidden />}
            <span
              className={`relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-brand text-white" : now ? "bg-brand text-white ring-4 ring-brand/20" : "border-2 border-stone-300 bg-white text-stone-500"
              }`}
            >
              {done ? <Check {...ICON} className="size-4" /> : i + 1}
            </span>
            <span className={`text-xs ${now ? "font-bold text-ink" : done ? "text-brand" : "text-stone-500"}`}>
              {done && <span className="sr-only">完了：</span>}
              {text}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
