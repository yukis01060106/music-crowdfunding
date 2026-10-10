import type { Metadata } from "next";
import { PageTitle } from "@/components/side-nav";
import { UsersTable } from "./users-table";
import { USERS } from "../admin-data";

export const metadata: Metadata = { title: "ユーザー" };

export default function AdminUsersPage() {
  return (
    <>
      <PageTitle>ユーザー</PageTitle>
      <UsersTable users={USERS} />
    </>
  );
}
