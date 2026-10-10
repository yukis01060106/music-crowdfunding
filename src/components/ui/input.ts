/**
 * 入力欄の見た目。ボタンと同じく角は付けない（検索欄だけは丸）。
 * 枠は白地に対して 3:1 以上の濃さ（stone-500）にして、欄の位置がわかるようにする。
 */
export const inputClass =
  "mt-1 w-full border border-stone-500 bg-white px-3 py-2.5 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 aria-[invalid=true]:border-rose-600 aria-[invalid=true]:bg-rose-50";

/** 検索欄（丸） */
export const searchInputClass = "w-full rounded-full border border-stone-500 bg-white px-5 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
