import type { Metadata } from "next";
import { PageTitle } from "@/components/side-nav";
import { FesFund } from "./fes-fund";
import { MONTHLY_FEES } from "../admin-data";

export const metadata: Metadata = { title: "ONE NOTE FES" };

export default function AdminFesPage() {
  return (
    <>
      <PageTitle>ONE NOTE FES の積み立て</PageTitle>
      <p className="mb-6 text-sm leading-relaxed text-stone-600">
        手数料収入の一部を、ONE NOTE FES の開催費用にあてます。あてる割合はまだ決まっていないため、ここでは割合を変えて試算できます。決まるまでは、サイトに割合や金額を出しません。
      </p>
      <FesFund months={MONTHLY_FEES} />
    </>
  );
}
