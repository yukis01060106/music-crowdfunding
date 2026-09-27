import type { Artist, Membership, MembershipPlan } from "@/types";

/**
 * どのアーティストのメンバーシップにも付く共通特典。
 * 月額の応援がクラファンとつながることが、ほかの会員サービスとの違い。
 */
export const MEMBER_COMMON_PERKS = [
  { title: "プロジェクトの先行支援", body: "新しいプロジェクトは公開の24時間前から支援できます。数量限定のリターンも先に選べます。" },
  { title: "メンバー限定の活動報告", body: "制作の裏側や、デモ音源をいちばん近くで。" },
  { title: "ONE NOTE FES の先行案内", body: "OTOFUNDの音楽フェス（企画中）の情報を、メンバーに先にお届けします。" },
];

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
