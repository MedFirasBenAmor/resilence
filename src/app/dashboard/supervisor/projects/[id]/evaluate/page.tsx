import { connection } from "next/server";
import {
  getProjectEvaluationSummary,
  listProjectMembersForEvaluation,
} from "@/lib/feedback-data";
import { BackButton } from "@/components/navigation/back-button";
import { EvaluationMemberCard } from "@/components/scoring/evaluation-member-card";
import { ScoreBadge } from "@/components/scoring/score-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type SupervisorEvaluatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupervisorEvaluatePage({
  params,
}: SupervisorEvaluatePageProps) {
  await connection();

  const { id } = await params;
  const [evaluationData, summary] = await Promise.all([
    listProjectMembersForEvaluation(id),
    getProjectEvaluationSummary(id),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="space-y-6">
        <BackButton fallbackHref="/dashboard/supervisor/projects" />

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Evaluation projet
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            {evaluationData.project.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            Evaluez les membres actifs du projet, structurez votre feedback qualitatif et
            alimentez la progression technique et professionnelle de chaque étudiant.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ScoreBadge value={summary.totalMembers || 0} label="Membres" />
            <ScoreBadge value={summary.evaluatedMembers || 0} label="Evalues" />
          </div>
        </section>

        {evaluationData.members.length ? (
          <section className="space-y-6">
            {evaluationData.members.map((member) => (
              <EvaluationMemberCard
                key={member.membershipId}
                projectId={evaluationData.project.id}
                member={member}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            title="Aucun membre a evaluer"
            description="Les membres actifs du projet apparaîtront ici dès qu'une candidature acceptée aura créé une affectation."
          />
        )}
      </div>
    </main>
  );
}
