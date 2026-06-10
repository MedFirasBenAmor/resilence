import { type PortfolioFeedbackRow } from "@/lib/portfolio-data";
import { ScoreBadge } from "@/components/scoring/score-badge";
import { EmptyState } from "@/components/ui/empty-state";

type PortfolioFeedbackListProps = {
  feedbacks: PortfolioFeedbackRow[];
};

export function PortfolioFeedbackList({ feedbacks }: PortfolioFeedbackListProps) {
  if (!feedbacks.length) {
    return (
      <EmptyState
        title="Pas encore de feedback"
        description="Les retours qualitatifs apparaîtront ici dès qu'un superviseur ou un admin évaluera votre travail."
      />
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <article key={feedback.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold text-slate-950">
                {feedback.title ?? feedback.projectTitle ?? "Feedback projet"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {feedback.projectTitle ?? "Projet"} • {feedback.evaluatorName ?? "Evaluateur"} •{" "}
                {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  feedback.createdAt,
                )}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-700">{feedback.comment}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ScoreBadge value={feedback.technicalAverage} label="Tech" />
              <ScoreBadge value={feedback.maturityAverage} label="Maturité" />
              <ScoreBadge value={feedback.globalScore} label="Global" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
