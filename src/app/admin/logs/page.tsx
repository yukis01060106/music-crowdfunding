import type { Metadata } from "next";
import { PageTitle } from "@/components/side-nav";
import { AuditLog } from "./audit-log";

export const metadata: Metadata = { title: "操作の記録" };

export default function AdminLogsPage() {
  return (
    <>
      <PageTitle>操作の記録</PageTitle>
      <p className="mb-6 text-sm leading-relaxed text-stone-600">運営が行った操作（停止・返金・本人確認・返信など）を、新しい順に残しています。あとから「誰が、いつ、何を、なぜ」したかを確かめるためのものです。</p>
      <AuditLog />
    </>
  );
}
