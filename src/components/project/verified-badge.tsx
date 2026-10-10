import { tagClass } from "@/components/ui/tag";

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span
      title="運営が本人確認済み"
      className={tagClass("brand")}
    >
      ✓ 本人確認済み
    </span>
  );
}
