import { notFound } from "next/navigation";
import { getArtist, getProject } from "@/lib/data";
import { formatYen } from "@/lib/format";
import { TrustBox } from "@/components/project/trust-box";
import { ArtistCard } from "@/components/project/artist-card";

const SECTIONS = [
  { id: "story", label: "ストーリー" },
  { id: "budget", label: "資金の使い道" },
  { id: "schedule", label: "スケジュール" },
  { id: "risks", label: "リスクとチャレンジ" },
  { id: "faq", label: "よくある質問" },
] as const;

export default async function ProjectStoryPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const artist = await getArtist(project.artistId);
  const budgetTotal = project.budget.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-10">
      {project.summary.length > 0 && (
        <section className="bg-brand-soft/60 p-5">
          <h2 className="text-sm font-bold text-brand">このプロジェクトで実現すること</h2>
          <ul className="mt-3 space-y-2">
            {project.summary.map((s) => (
              <li key={s} className="flex gap-2 font-medium">
                <span aria-hidden className="text-brand">
                  ♪
                </span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="目次" className="flex flex-wrap gap-2 text-sm">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-stone-300 bg-white px-3 py-1 hover:border-brand hover:text-brand">
            {s.label}
          </a>
        ))}
      </nav>

      <Section id="story" title="ストーリー">
        <div className="space-y-4 leading-loose text-stone-700">
          {project.story.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section id="budget" title="資金の使い道">
        <ul className="space-y-3">
          {project.budget.map((b) => (
            <li key={b.label}>
              <div className="flex justify-between text-sm">
                <span>{b.label}</span>
                <span className="font-medium">{formatYen(b.amount)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-brand/70" style={{ width: `${(b.amount / budgetTotal) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-sm text-stone-500">合計 {formatYen(budgetTotal)}</p>
      </Section>

      <Section id="schedule" title="スケジュール">
        <ol className="relative space-y-4 border-l-2 border-brand-soft pl-5">
          {project.schedule.map((s) => (
            <li key={s.label} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand" aria-hidden />
              <p className="text-xs text-stone-500">{s.date}</p>
              <p className="font-medium">{s.label}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="risks" title="リスクとチャレンジ">
        <p className="leading-relaxed text-stone-700">{project.risks}</p>
      </Section>

      <Section id="faq" title="よくある質問">
        <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {project.faqs.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="flex cursor-pointer list-none justify-between gap-4 font-medium">
                Q. {f.q}
                <span className="text-stone-400 transition group-open:rotate-45" aria-hidden>
                  ＋
                </span>
              </summary>
              <p className="mt-2 text-sm text-stone-600">A. {f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <TrustBox fundingModel={project.fundingModel} verified={artist?.verified ?? false} />
      {artist && <ArtistCard artist={artist} />}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 border-l-4 border-brand pl-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
