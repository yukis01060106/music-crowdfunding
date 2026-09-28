import { getPublicProjects } from "@/lib/data";
import { Backings } from "./backings";

export default async function MyPage() {
  const projects = await getPublicProjects();
  return <Backings projects={projects} />;
}
