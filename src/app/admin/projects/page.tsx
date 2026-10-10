import type { Metadata } from "next";
import { getArtists, getPublicProjects } from "@/lib/data";
import { progressPercent } from "@/lib/format";
import { PageTitle } from "@/components/side-nav";
import { ProjectsTable, type AdminProjectRow } from "./projects-table";
import { INBOX } from "../admin-data";

export const metadata: Metadata = { title: "プロジェクト" };

export default async function AdminProjectsPage() {
  const [projects, artists] = await Promise.all([getPublicProjects(), getArtists()]);
  const rows: AdminProjectRow[] = projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    artist: artists.find((a) => a.id === p.artistId)?.name ?? "",
    status: p.status,
    fundingModel: p.fundingModel,
    goalType: p.goalType,
    raised: p.raised,
    backers: p.backers,
    percent: progressPercent(p),
    endAt: p.endAt,
  }));
  return (
    <>
      <PageTitle>プロジェクト</PageTitle>
      <ProjectsTable rows={rows} reports={INBOX.filter((i) => i.kind === "report" && i.targetSlug).map((i) => ({ id: i.id, slug: i.targetSlug!, status: i.status }))} />
    </>
  );
}
