import { EmptyState } from "@/components/ui/empty-state";
import { type StudentProgressResult } from "@/lib/feedback-data";

type ProjectProgressTableProps = {
  projects: StudentProgressResult["projects"];
};

export function ProjectProgressTable({ projects }: ProjectProgressTableProps) {
  if (!projects.length) {
    return (
      <EmptyState
        title="Aucun projet evalue"
        description="La progression par projet apparaîtra ici dès que vous aurez reçu une première évaluation."
      />
    );
  }

  return (
    <div className="app-panel overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1.7fr)_0.6fr_0.7fr_0.7fr_0.7fr] gap-4 border-b border-slate-200/90 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:grid">
        <span>Projet</span>
        <span>Feedbacks</span>
        <span>Technique</span>
        <span>Maturité</span>
        <span>Global</span>
      </div>
      <div className="divide-y divide-slate-200/90">
        {projects.map((project) => (
          <article
            key={project.projectId}
            className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1.7fr)_0.6fr_0.7fr_0.7fr_0.7fr] md:items-center"
          >
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-950">{project.projectTitle}</p>
              <p className="mt-1 text-sm text-slate-500">Projet evalue</p>
            </div>
            <div className="text-sm text-slate-600">{project.feedbackCount}</div>
            <MetricPill value={project.technicalAverage} />
            <MetricPill value={project.maturityAverage} />
            <MetricPill value={project.globalScore} dark />
          </article>
        ))}
      </div>
    </div>
  );
}

function MetricPill({ value, dark = false }: { value: number; dark?: boolean }) {
  return (
    <div
      className={
        dark
          ? "rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
          : "rounded-2xl bg-cyan-50 px-4 py-3 text-center text-sm font-semibold text-slate-800"
      }
    >
      {Math.round(value)}
    </div>
  );
}
