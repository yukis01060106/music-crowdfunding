import { PageTitle, Placeholder } from "@/components/side-nav";

// TODO: Stripe Connect の Express アカウントで本人確認と振込先登録を行う
export default function PayoutPage() {
  return (
    <>
      <PageTitle>入金・振込先</PageTitle>
      <Placeholder>
        本人確認と振込先口座の登録（Stripe Connect）がここに入ります。
        <br />
        募集終了後、手数料を差し引いた金額が振り込まれます。
      </Placeholder>
    </>
  );
}
