import { DeliverableStatus } from "@prisma/client";
import { DeliverableReviewActions } from "@/components/project-room/deliverable-review-actions";
import { DeliverableStatusBadge } from "@/components/project-room/deliverable-status-badge";
import { EmptyState } from "@/components/ui/empty-state";

type DeliverableListProps = {
  projectId: string;
  canReview: boolean;
  deliverables: Array<{
    id: string;
    title: string;
    description: string | null;
    submissionUrl: string | null;
    repositoryUrl: string | null;
    status: DeliverableStatus;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    authorName: string | null;
    taskTitle: string | null;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export function DeliverableList({
  projectId,
  canReview,
  deliverables,
}: DeliverableListProps) {
  const pendingDeliverables = deliverables.filter(
    (deliverable) =>
      deliverable.status === DeliverableStatus.DRAFT ||
      deliverable.status === DeliverableStatus.REJECTED,
  );
  const submittedDeliverables = deliverables.filter(
    (deliverable) =>
      deliverable.status === DeliverableStatus.SUBMITTED ||
      deliverable.status === DeliverableStatus.IN_REVIEW,
  );
  const reviewedDeliverables = deliverables.filter(
    (deliverable) =>
      deliverable.status === DeliverableStatus.REVIEWED ||
      deliverable.status === DeliverableStatus.APPROVED,
  );

  if (!deliverables.length) {
    return (
      <EmptyState
        title="Aucun livrable"
        description="Quand l'équipe publie une preuve de travail, elle remonte ici avec son état de relecture."
      />
    );
  }

  const groups = [
    {
      id: "pending",
      title: "Pending",
      description: "Livrables à préparer ou à retravailler avant nouvelle soumission.",
      deliverables: pendingDeliverables,
    },
    {
      id: "submitted",
      title: "Submitted",
      description: "Livrables envoyés et encore en attente de lecture ou de validation.",
      deliverables: submittedDeliverables,
    },
    {
      id: "reviewed",
      title: "Reviewed",
      description: "Preuves déjà relues ou validées dans cette room.",
      deliverables: reviewedDeliverables,
    },
  ] as const;

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.id} className="app-panel p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {group.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {group.deliverables.length} livrable{group.deliverables.length > 1 ? "s" : ""}
            </span>
          </div>

          {group.deliverables.length ? (
            <div className="mt-5 space-y-4">
              {group.deliverables.map((deliverable) => (
                <article key={deliverable.id} className="rounded-[1.55rem] border border-slate-200/90 bg-white/92 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                        {deliverable.title}
                      </h3>
                      {deliverable.description ? (
                        <p className="mt-3 text-sm leading-7 text-slate-700">{deliverable.description}</p>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          Ajoutez un contexte clair pour faciliter la relecture.
                        </p>
                      )}
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          Auteur:{" "}
                          <span className="font-medium text-slate-900">
                            {deliverable.authorName ?? "Non renseigné"}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          Tâche liée:{" "}
                          <span className="font-medium text-slate-900">
                            {deliverable.taskTitle ?? "Aucune"}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          Soumis:{" "}
                          <span className="font-medium text-slate-900">
                            {formatDate(deliverable.submittedAt)}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          Revu:{" "}
                          <span className="font-medium text-slate-900">
                            {formatDate(deliverable.reviewedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        {deliverable.submissionUrl ? (
                          <a
                            className="font-medium text-sky-700 underline underline-offset-4"
                            href={deliverable.submissionUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ouvrir le livrable
                          </a>
                        ) : null}
                        {deliverable.repositoryUrl ? (
                          <a
                            className="font-medium text-sky-700 underline underline-offset-4"
                            href={deliverable.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ouvrir le repository
                          </a>
                        ) : null}
                      </div>
                      {deliverable.reviewComment ? (
                        <div className="mt-4 rounded-[1.35rem] border border-emerald-200/90 bg-emerald-50/70 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                            Feedback visible
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {deliverable.reviewComment}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <DeliverableStatusBadge status={deliverable.status} />
                  </div>

                  {canReview ? (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <DeliverableReviewActions
                        projectId={projectId}
                        deliverableId={deliverable.id}
                      />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-5 text-sm leading-6 text-slate-600">
              Aucun livrable dans cette étape pour le moment. La prochaine soumission utile apparaîtra ici.
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
