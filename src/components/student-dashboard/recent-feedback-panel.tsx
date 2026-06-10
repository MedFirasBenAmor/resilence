import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

type RecentFeedbackPanelProps = {
  feedbacks: Array<{
    id: string;
    title: string | null;
    comment: string;
    createdAt: Date;
    projectTitle: string | null;
    evaluatorName: string | null;
    globalScore: number;
  }>;
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

export function RecentFeedbackPanel({ feedbacks }: RecentFeedbackPanelProps) {
  return (
    <section className="app-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="app-eyebrow">Feedback récent</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Ce qu&apos;il faut relire maintenant
          </h3>
        </div>
        <Link href="/dashboard/student/progress" className="app-button-secondary text-sm">
          Voir la progression
        </Link>
      </div>

      <div className="mt-5">
        {feedbacks.length ? (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <article
                key={feedback.id}
                className="rounded-[1.5rem] border border-slate-200/85 bg-slate-50/88 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-slate-950">
                      {feedback.title ?? feedback.projectTitle ?? "Feedback projet"}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {truncate(feedback.comment, 150)}
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    Score {feedback.globalScore.toFixed(1)}
                  </div>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {(feedback.projectTitle ?? "Projet").concat(" - ")}
                  {feedback.evaluatorName ?? "Evaluateur"} -{" "}
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                    feedback.createdAt,
                  )}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun feedback récent"
            description="Vos premiers retours apparaîtront ici après une relecture de livrable ou une évaluation projet."
          />
        )}
      </div>
    </section>
  );
}
