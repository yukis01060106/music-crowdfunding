import { Suspense } from "react";
import { getArtists, getPublicProjects } from "@/lib/data";
import { PageTitle } from "@/components/side-nav";
import { Messages } from "./messages";
import { OperatorMessages } from "./operator-messages";

export default async function MessagesPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  return (
    <>
      <PageTitle>メッセージ</PageTitle>
      <Suspense>
        <Messages projects={projects} artists={artists} />
        <OperatorMessages projects={projects.map((p) => ({ slug: p.slug, title: p.title }))} />
      </Suspense>
    </>
  );
}
