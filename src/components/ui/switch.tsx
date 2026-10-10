"use client";

/**
 * オン・オフのスイッチ。label の中に置いて使う（文言のクリックでも切り替わる）。
 * オフの色も白地に対して 3:1 以上にして、状態が見分けられるようにする。
 */
export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-brand" : "bg-stone-500"}`}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      <span className="pointer-events-none absolute -inset-1 rounded-full ring-brand peer-focus-visible:ring-2" />
    </span>
  );
}
