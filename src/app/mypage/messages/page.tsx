import { Suspense } from "react";
import { getArtists, getPublicProjects } from "@/lib/data";
import { PageTitle } from "@/components/side-nav";
import { Messages } from "./messages";

export default async function MessagesPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  return (
    <>
      <PageTitle>メッセージ</PageTitle>
      <Suspense>
        <Messages projects={projects} artists={artists} />
      </Suspense>
    </>
  );
}
