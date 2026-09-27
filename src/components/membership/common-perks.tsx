import { MEMBER_COMMON_PERKS } from "@/lib/membership";

/** どのメンバーシップにも付く、クラファンと連動した共通特典 */
export function CommonPerks({ dark = false }: { dark?: boolean }) {
  return (
    <ul data-stagger className="grid gap-4 sm:grid-cols-3">
      {MEMBER_COMMON_PERKS.map((perk, i) => (
        <li key={perk.title} className={`transition duration-300 hover:-translate-y-1 ${dark ? "border border-white/30 p-5" : "bg-stone-100 p-5 hover:bg-brand-soft"}`}>
          <p className={`font-en text-3xl font-black ${dark ? "text-pop-yellow" : "text-brand/30"}`}>0{i + 1}</p>
          <p className="mt-1 font-bold tracking-wider">{perk.title}</p>
          <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/75" : "text-stone-600"}`}>{perk.body}</p>
        </li>
      ))}
    </ul>
  );
}
