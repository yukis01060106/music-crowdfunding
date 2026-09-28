import { getArtists } from "@/lib/data";
import { PageTitle } from "@/components/side-nav";
import { Subscriptions } from "./subscriptions";

export default async function MyMembershipPage() {
  const artists = await getArtists();
  return (
    <>
      <PageTitle>加入中のメンバーシップ</PageTitle>
      <Subscriptions artists={artists} />
    </>
  );
}
