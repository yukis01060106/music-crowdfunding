import type { Artist, Membership, MembershipPlan } from "@/types";

/**
 * どのアーティストのメンバーシップにも付く共通特典。
 * 月額の応援がクラファンとつながることが、ほかの会員サービスとの違い。
 */
export const MEMBER_COMMON_PERKS = [
  { title: "プロジェクトの先行支援", body: "新しいプロジェクトは公開の24時間前から支援できます。数量限定のリターンも先に選べます。" },
  { title: "メンバー限定の活動報告", body: "制作の裏側や、デモ音源をいちばん近くで。" },
  { title: "ONE NOTE FES の先行案内", body: "Oto Fundの音楽フェス（企画中）の情報を、メンバーに先にお届けします。" },
];

/** 月額の下限。決済手数料で赤字にならない額 */
export const MEMBERSHIP_MIN_PRICE = 300;
export const MEMBERSHIP_MAX_PRICE = 10_000;

/**
 * プラン変更のルール（FAQ・加入画面・マイページで共通）。
 * 上位への変更は新しい特典がすぐ使え、月額は次回の更新日から新しい金額になる。下位への変更は次回の更新日から切り替わる。
 */
export const PLAN_CHANGE_RULE =
  "上位プランへの変更は、新しい特典が今日から使え、月額は次回の更新日から新しい金額になります。下位プランへの変更は、次回の更新日から切り替わります。";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 日本時間の年・月・日 */
function jstParts(ms: number) {
  const d = new Date(ms + JST_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
}

/** 日本時間のその日の 0 時（UTC のミリ秒） */
function jstMidnight(y: number, m: number, day: number): number {
  return Date.UTC(y, m, day) - JST_OFFSET_MS;
}

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/**
 * 次回の更新日（日本時間の 0 時）。加入日と同じ日付で毎月更新する。
 * 31日に加入した人は、その日がない月は月末に更新する。
 */
export function nextBillingDate(joinedAt: string, now: number): Date {
  const joinedDay = jstParts(new Date(joinedAt).getTime()).day;
  const { y, m } = jstParts(now);
  for (let i = 0; i < 2; i++) {
    const mm = m + i;
    const yy = y + Math.floor(mm / 12);
    const mon = ((mm % 12) + 12) % 12;
    const t = jstMidnight(yy, mon, Math.min(joinedDay, daysInMonth(yy, mon)));
    if (t > now) return new Date(t);
  }
  const yy = y + Math.floor((m + 2) / 12);
  const mon = (m + 2) % 12;
  return new Date(jstMidnight(yy, mon, Math.min(joinedDay, daysInMonth(yy, mon))));
}

/** 解約後に特典を使える最終日（次回の更新日の前日） */
export function lastBenefitDay(joinedAt: string, now: number): Date {
  return new Date(nextBillingDate(joinedAt, now).getTime() - DAY_MS);
}

export function isPlanFull(plan: MembershipPlan): boolean {
  return plan.limit !== undefined && plan.members >= plan.limit;
}

export function lowestPlanPrice(membership: Membership): number {
  return Math.min(...membership.plans.map((p) => p.price));
}

export function totalMembers(membership: Membership): number {
  return membership.plans.reduce((sum, p) => sum + p.members, 0);
}

/** メンバーシップを開設しているアーティスト */
export function withMembership(artists: Artist[]): (Artist & { membership: Membership })[] {
  return artists.filter((a): a is Artist & { membership: Membership } => a.membership !== undefined);
}
