import { EvaluationForm } from "@/components/scoring/evaluation-form";
import { ScoreBadge } from "@/components/scoring/score-badge";
import type { EvaluationMemberRow } from "@/lib/feedback-data";

type EvaluationMemberCardProps = {
  projectId: string;
  member: EvaluationMemberRow;
};

export function EvaluationMemberCard({
  projectId,
  member,
}: EvaluationMemberCardProps) {
  return (
    <article className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{member.studentName}</h2>
          <p className="mt-1 text-sm text-slate-600">{member.studentEmail}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {member.level}{member.roleLabel ? ` • ${member.roleLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge value={member.technicalAverage} label="Tech" />
          <ScoreBadge value={member.maturityAverage} label="Maturité" />
          <ScoreBadge value={member.globalScore} label="Global" />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>{member.feedbackCount} feedback(s) enregistres sur ce projet.</p>
        <p className="mt-2">
          Livrables lies: {member.deliverables.length ? member.deliverables.length : "aucun"}
        </p>
      </div>

      <EvaluationForm
        projectId={projectId}
        membershipId={member.membershipId}
        studentName={member.studentName}
        deliverables={member.deliverables}
      />
    </article>
  );
}
