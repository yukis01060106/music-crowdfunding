import type { Metadata } from "next";
import { PageTitle } from "@/components/side-nav";
import { InboxList } from "./inbox-list";
import { INBOX, INBOX_REPLY_TEMPLATES } from "../admin-data";

export const metadata: Metadata = { title: "問い合わせ・通報" };

export default function AdminInboxPage() {
  return (
    <>
      <PageTitle>問い合わせ・通報</PageTitle>
      <InboxList items={[...INBOX].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))} templates={INBOX_REPLY_TEMPLATES} />
    </>
  );
}
