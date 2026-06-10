import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/scoring/score-badge";
import { type AdminFeedbackListResult } from "@/lib/feedback-data";

type AdminFeedbackTableProps = {
  feedbacks: AdminFeedbackListResult["items"];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function AdminFeedbackTable({ feedbacks }: AdminFeedbackTableProps) {
  if (!feedbacks.length) {
    return (
      <EmptyState
        title="Aucun feedback"
        description="Aucun feedback ne correspond aux filtres courants."
      />
    );
  }

  return (
    <section className="space-y-4">
      {feedbacks.map((feedback) => (
        <article key={feedback.id} className="app-panel app-hover-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-950">
                {feedback.title ?? "Feedback sans titre"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {feedback.studentName} • {feedback.projectTitle ?? "Projet non renseigne"} •{" "}
                {feedback.evaluatorName ?? "Evaluateur non renseigne"}
              </p>
              <p className="mt-2 text-sm text-slate-500">{formatDate(feedback.createdAt)}</p>
              <div className="mt-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4">
                <p className="text-sm leading-7 text-slate-700">{feedback.comment}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <ScoreBadge value={feedback.technicalAverage} label="Tech" />
              <ScoreBadge value={feedback.maturityAverage} label="Maturité" />
              <ScoreBadge value={feedback.globalScore} label="Global" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
