import { getArtist, getCreatorProjects } from "@/lib/data";
import { formatDate, formatYen, progressPercent } from "@/lib/format";
import { FES_FUND_MESSAGE, PLATFORM_FEE_RATE, payoutAmount } from "@/lib/fees";
import { PageTitle } from "@/components/side-nav";

// TODO: Stripe Connect の Express アカウントで本人確認と振込先登録を行い、状態は Stripe から取得する
const ACCOUNT = { identity: true, bank: "○○銀行 渋谷支店 普通 ****123", payoutsEnabled: true };

/** 募集終了から振込までの目安 */
const PAYOUT_DAYS = 14;

export default async function PayoutPage() {
  const [projects, artist] = await Promise.all([getCreatorProjects(), getArtist("hoshizora-radio")]);
  const membershipMonthly = artist?.membership?.plans.reduce((sum, p) => sum + p.price * p.members, 0) ?? 0;

  return (
    <>
      <PageTitle>入金・振込先</PageTitle>

      <section className="mb-8 grid gap-3 sm:grid-cols-3" data-stagger>
        <Status label="本人確認" ok={ACCOUNT.identity} value={ACCOUNT.identity ? "確認済み" : "未提出"} />
        <Status label="振込先口座" ok={ACCOUNT.bank !== ""} value={ACCOUNT.bank || "未登録"} />
        <Status label="振込" ok={ACCOUNT.payoutsEnabled} value={ACCOUNT.payoutsEnabled ? "受け取り可能" : "停止中"} />
      </section>

      <h2 className="mb-3 font-bold">プロジェクトの入金予定</h2>
      <div className="overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="p-3">プロジェクト</th>
              <th className="p-3 text-right">支援総額</th>
              <th className="p-3 text-right">手数料（{PLATFORM_FEE_RATE * 100}%）</th>
              <th className="p-3 text-right">振込額</th>
              <th className="p-3">振込予定</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {projects.map((p) => {
              const achieved = p.fundingModel === "all_in" || progressPercent(p) >= 100;
              const payDate = new Date(new Date(p.endAt).getTime() + PAYOUT_DAYS * 86_400_000).toISOString();
              return (
                <tr key={p.slug}>
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 text-right">{formatYen(p.raised)}</td>
                  <td className="p-3 text-right text-stone-500">−{formatYen(p.raised - payoutAmount(p.raised))}</td>
                  <td className="p-3 text-right font-bold">{formatYen(payoutAmount(p.raised))}</td>
                  <td className="p-3 text-xs text-stone-500">{achieved ? `${formatDate(payDate)}ごろ` : "目標達成時のみ"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        募集終了から約{PAYOUT_DAYS}日後に振り込みます。All-or-Nothing で目標に届かなかった場合は、支援者への請求も手数料も発生しません。
      </p>

      {membershipMonthly > 0 && (
        <>
          <h2 className="mb-3 mt-10 font-bold">メンバーシップの入金</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Box label="今月の売上" value={formatYen(membershipMonthly)} />
            <Box label="手数料" value={`−${formatYen(membershipMonthly - payoutAmount(membershipMonthly))}`} />
            <Box label="翌月15日に振込" value={formatYen(payoutAmount(membershipMonthly))} strong />
          </div>
        </>
      )}

      <p className="mt-10 bg-brand-soft p-4 text-sm font-bold text-brand">{FES_FUND_MESSAGE}</p>
    </>
  );
}

function Status({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="border border-stone-200 bg-white p-4">
      <p className="flex items-center gap-2 text-xs text-stone-500">
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function Box({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "bg-brand-soft p-4" : "bg-stone-50 p-4"}>
      <p className={`text-xs ${strong ? "text-brand" : "text-stone-500"}`}>{label}</p>
      <p className={`mt-1 font-en text-xl font-black ${strong ? "text-brand" : ""}`}>{value}</p>
    </div>
  );
}
