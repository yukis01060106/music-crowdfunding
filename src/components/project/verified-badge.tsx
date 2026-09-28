export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span
      title="運営が本人確認済み"
      className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700"
    >
      ✓ 本人確認済み
    </span>
  );
}
