import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { TrackList } from "@/components/project/track-list";

export default async function ProjectStoryPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <p className="text-lg font-medium">{project.catchcopy}</p>
      <TrackList tracks={project.tracks} />
      <article className="space-y-4 leading-relaxed text-stone-700">
        {project.story.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </article>
    </div>
  );
}
