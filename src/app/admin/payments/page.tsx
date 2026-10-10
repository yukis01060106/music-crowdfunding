import type { Metadata } from "next";
import { getArtists, getPublicProjects } from "@/lib/data";
import { formatDate, formatYen, progressPercent } from "@/lib/format";
import { FEE_LABEL, PAYOUT_DAYS, payoutAmount } from "@/lib/fees";
import { PageTitle } from "@/components/side-nav";
import { DemoNote, SectionTitle, TableBox, TD, TH } from "../admin-ui";
import { FINISHED_PAYOUTS, PAYMENT_FAILURES, REFUND_REQUESTS } from "../admin-data";
import { FailureList, PaymentKpis, PayoutTable, RefundList } from "./payment-actions";

export const metadata: Metadata = { title: "お金の流れ" };


export default async function AdminPaymentsPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  // 募集中のものは、今の額で終わったときの見込み。All-or-Nothing は目標に届いたときだけ振込がある
  const forecast = projects
    .filter((p) => p.status === "live")
    .map((p) => {
      const reached = progressPercent(p) >= 100;
      const payDate = new Date(new Date(p.endAt).getTime() + PAYOUT_DAYS * 24 * 60 * 60 * 1000).toISOString();
      return { p, reached, counts: p.fundingModel === "all_in" || reached, payDate, artist: artists.find((a) => a.id === p.artistId)?.name ?? "" };
    });
  const membershipRows = artists
    .filter((a) => a.membership)
    .map((a) => {
      const sales = a.membership!.plans.reduce((s, p) => s + p.price * p.members, 0);
      return { name: a.name, sales, payout: payoutAmount(sales) };
    })
    .sort((a, b) => b.sales - a.sales);

  return (
    <>
      <PageTitle>お金の流れ</PageTitle>
      <PaymentKpis refunds={REFUND_REQUESTS} failures={PAYMENT_FAILURES} payouts={FINISHED_PAYOUTS} membershipPayout={membershipRows.reduce((sum, r) => sum + r.payout, 0)} />

      {/* 対応が必要なもの（返金・決済の失敗）を先に、参考の表を後に置く */}
      <section id="refunds" className="scroll-mt-24">
        <SectionTitle>返金の申し出</SectionTitle>
        <RefundList items={REFUND_REQUESTS} />
      </section>

      <section id="failures" className="scroll-mt-24">
        <SectionTitle aside="カードの期限切れや残高不足。本人にカードの更新をお願いする">決済の失敗</SectionTitle>
        <FailureList items={PAYMENT_FAILURES} />
      </section>

      <section id="payouts" className="scroll-mt-24">
        <SectionTitle aside={`募集終了から約${PAYOUT_DAYS}日後に振込。手数料は${FEE_LABEL}（決済手数料込み）`}>終了したプロジェクトの振込</SectionTitle>
        <PayoutTable items={FINISHED_PAYOUTS} />
      </section>

      <SectionTitle aside="今の額で募集が終わった場合">募集中のプロジェクトの見込み</SectionTitle>
      <TableBox label="募集中のプロジェクトの振込の見込み" minWidth={720}>
        <thead className="bg-stone-50">
          <tr>
            <th className={TH}>プロジェクト</th>
            <th className={`${TH} text-right`}>集まった額</th>
            <th className={`${TH} text-right`}>振込の見込み</th>
            <th className={TH}>振込日の見込み</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {forecast.map(({ p, reached, counts, payDate, artist }) => (
            <tr key={p.slug}>
              <th scope="row" className={`${TD} text-left font-normal`}>
                <span className="font-bold">{p.title}</span>
                <span className="block text-xs text-stone-500">
                  {artist}・{p.fundingModel === "all_or_nothing" ? "All-or-Nothing" : "All-in"}
                  {p.goalType === "participants" && "・参加人数が目標"}
                </span>
              </th>
              <td className={`${TD} text-right`}>{formatYen(p.raised)}</td>
              <td className={`${TD} text-right font-bold`}>
                {counts ? formatYen(payoutAmount(p.raised)) : <span className="font-normal text-stone-500">今は目標未達（届けば {formatYen(payoutAmount(p.raised))}）</span>}
                {p.fundingModel === "all_or_nothing" && reached && <span className="block text-xs font-normal text-stone-500">終了後にカードへ一斉に請求</span>}
              </td>
              <td className={`${TD} text-stone-600`}>{formatDate(payDate)}</td>
            </tr>
          ))}
        </tbody>
      </TableBox>

      <section id="membership" className="scroll-mt-24">
        <SectionTitle aside="毎月の売上から手数料を引いて、翌月15日に振込">メンバーシップの振込</SectionTitle>
        <TableBox label="メンバーシップの振込" minWidth={480}>
          <thead className="bg-stone-50">
            <tr>
              <th className={TH}>アーティスト</th>
              <th className={`${TH} text-right`}>今月の売上</th>
              <th className={`${TH} text-right`}>振込額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {membershipRows.map((r) => (
              <tr key={r.name}>
                <th scope="row" className={`${TD} text-left font-bold`}>
                  {r.name}
                </th>
                <td className={`${TD} text-right`}>{formatYen(r.sales)}</td>
                <td className={`${TD} text-right font-bold`}>{formatYen(r.payout)}</td>
              </tr>
            ))}
          </tbody>
        </TableBox>
      </section>

      <DemoNote>
        デモのため、数字は見本です。本番では Stripe の入金・返金・振込の記録から作ります。振込は Stripe Connect で各アーティストの口座へ送ります。
      </DemoNote>
    </>
  );
}
