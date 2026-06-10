import { connection } from "next/server";
import { DeliverableStatus, TaskStatus } from "@prisma/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BackButton } from "@/components/navigation/back-button";
import { getProjectRoomData } from "@/lib/project-room-data";
import { DeliverableForm } from "@/components/project-room/deliverable-form";
import { DeliverableList } from "@/components/project-room/deliverable-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCommentForm } from "@/components/project-room/project-comment-form";
import { ProjectCommentList } from "@/components/project-room/project-comment-list";
import { ProjectExecutionSummary } from "@/components/project-room/project-execution-summary";
import { ProjectRoomActivityFeed } from "@/components/project-room/project-room-activity-feed";
import { ProjectMembersList } from "@/components/project-room/project-members-list";
import { ProjectRoomHeader } from "@/components/project-room/project-room-header";
import { ProjectRoomRecentFeedback } from "@/components/project-room/project-room-recent-feedback";
import { ProjectTaskForm } from "@/components/project-room/project-task-form";
import { ProjectTaskList } from "@/components/project-room/project-task-list";
import { deliverableStatusLabels, taskStatusLabels } from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

type ProjectRoomPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectRoomPage({
  params,
}: ProjectRoomPageProps) {
  await connection();

  const { id } = await params;
  const room = await getProjectRoomData(id);
  const now = new Date();

  const blockedTasks = room.tasks.filter((task) => task.status === TaskStatus.BLOCKED);
  const overdueTasks = room.tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.dueDate !== null &&
      task.dueDate.getTime() < now.getTime(),
  );
  const nextMilestone =
    room.tasks.find(
      (task) => task.status !== TaskStatus.DONE && task.dueDate !== null,
    ) ?? room.tasks.find((task) => task.status !== TaskStatus.DONE) ?? null;
  const nextDeliverable =
    room.deliverables.find(
      (deliverable) =>
        deliverable.status === DeliverableStatus.DRAFT ||
        deliverable.status === DeliverableStatus.REJECTED,
    ) ??
    room.deliverables.find(
      (deliverable) =>
        deliverable.status === DeliverableStatus.SUBMITTED ||
        deliverable.status === DeliverableStatus.IN_REVIEW,
    ) ??
    room.deliverables[0] ??
    null;
  const feedbackItems = [
    ...room.deliverables
      .filter((deliverable) => deliverable.reviewComment && deliverable.reviewedAt)
      .map((deliverable) => ({
        id: `deliverable-${deliverable.id}`,
        sourceLabel: "Review livrable",
        title: deliverable.title,
        body: deliverable.reviewComment ?? "",
        createdAt: deliverable.reviewedAt ?? new Date(0),
      })),
    ...room.comments.slice(0, 2).map((comment) => ({
      id: `comment-${comment.id}`,
      sourceLabel: "Commentaire room",
      title: comment.deliverableTitle
        ? `Suivi sur ${comment.deliverableTitle}`
        : "Commentaire de suivi",
      body: comment.body,
      createdAt: comment.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  const attentionItems = [
    overdueTasks[0]
      ? {
          id: `overdue-${overdueTasks[0].id}`,
          label: "Échéance",
          title: overdueTasks[0].title,
          description: `Cette tâche a dépassé son échéance du ${formatDate(overdueTasks[0].dueDate)}. Il faut la traiter ou la replanifier maintenant.`,
          tone: "danger" as const,
        }
      : null,
    blockedTasks[0]
      ? {
          id: `blocked-${blockedTasks[0].id}`,
          label: "Blocage",
          title: blockedTasks[0].title,
          description: "Une tâche est bloquée dans le flux actif. Utilisez les commentaires ou la relecture d'un livrable pour relancer l'exécution.",
          tone: "warning" as const,
        }
      : null,
    nextDeliverable &&
    (nextDeliverable.status === DeliverableStatus.DRAFT ||
      nextDeliverable.status === DeliverableStatus.REJECTED)
      ? {
          id: `deliverable-submit-${nextDeliverable.id}`,
          label: "Soumission",
          title: nextDeliverable.title,
          description: "Ce livrable demande une soumission ou une nouvelle version avant que le projet puisse avancer.",
          tone: "warning" as const,
        }
      : null,
    nextDeliverable &&
    (nextDeliverable.status === DeliverableStatus.SUBMITTED ||
      nextDeliverable.status === DeliverableStatus.IN_REVIEW)
      ? {
          id: `deliverable-review-${nextDeliverable.id}`,
          label: "Review",
          title: nextDeliverable.title,
          description: "Ce livrable attend une lecture, un feedback ou une validation pour débloquer la suite.",
          tone: "info" as const,
        }
      : null,
    feedbackItems[0]
      ? {
          id: `feedback-${feedbackItems[0].id}`,
          label: "Feedback",
          title: feedbackItems[0].title,
          description: feedbackItems[0].body,
          tone: "success" as const,
        }
      : null,
  ].flatMap((item) => (item ? [item] : []));

  const activityItems = [
    ...room.comments.map((comment) => ({
      id: `comment-${comment.id}`,
      title: `${comment.authorName} a publié un commentaire`,
      description: comment.deliverableTitle
        ? `Suivi lié au livrable ${comment.deliverableTitle}.`
        : "Un nouveau message de suivi est disponible dans la room.",
      createdAt: comment.createdAt,
      tone: "info" as const,
    })),
    ...room.deliverables
      .filter((deliverable) => deliverable.submittedAt)
      .map((deliverable) => ({
        id: `deliverable-submitted-${deliverable.id}`,
        title: `${deliverable.title} a été soumis`,
        description: deliverable.authorName
          ? `Soumission préparée par ${deliverable.authorName}.`
          : "Une nouvelle preuve de travail est disponible.",
        createdAt: deliverable.submittedAt ?? new Date(0),
        tone: "success" as const,
      })),
    ...room.deliverables
      .filter((deliverable) => deliverable.reviewedAt)
      .map((deliverable) => ({
        id: `deliverable-reviewed-${deliverable.id}`,
        title: `${deliverable.title} a reçu une relecture`,
        description: deliverable.reviewComment
          ? "Un commentaire de relecture est visible dans la room."
          : "Le statut du livrable a été mis à jour.",
        createdAt: deliverable.reviewedAt ?? new Date(0),
        tone: "warning" as const,
      })),
    ...room.tasks
      .filter((task) => task.completedAt)
      .map((task) => ({
        id: `task-done-${task.id}`,
        title: `${task.title} est terminée`,
        description: "La progression du projet avance sur cette étape.",
        createdAt: task.completedAt ?? new Date(0),
        tone: "success" as const,
      })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const fallbackHref =
    room.viewerRole === "ADMIN"
      ? `/dashboard/admin/projects/${room.project.id}`
      : room.viewerRole === "SUPERVISOR"
        ? `/dashboard/supervisor/projects/${room.project.id}`
        : room.viewerRole === "STUDENT"
          ? `/dashboard/student/projects/${room.project.id}`
          : "/dashboard/company";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <BackButton fallbackHref={fallbackHref} />

        <ProjectRoomHeader project={room.project} progress={room.progress} />

        {room.permissions.isReadOnlyCompany ? (
          <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <p className="text-sm leading-6 text-sky-900">
              Acces entreprise en lecture seule sur cette room MVP. Les commentaires
              entreprise ne sont pas encore ouverts a ce stade.
            </p>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <ProjectExecutionSummary items={attentionItems} />

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="app-panel p-6">
                <p className="app-eyebrow">Next milestone</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Prochaine étape structurante
                </h2>
                {nextMilestone ? (
                  <div className="mt-5 rounded-[1.7rem] border border-slate-200 bg-white/92 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Tâche cible
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                      {nextMilestone.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {nextMilestone.description ?? "Cette tâche donne le prochain jalon concret du projet."}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Échéance:{" "}
                        <span className="font-medium text-slate-900">
                          {formatDate(nextMilestone.dueDate)}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Statut:{" "}
                        <span className="font-medium text-slate-900">
                          {taskStatusLabels[nextMilestone.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun jalon actif"
                    description="Créez une tâche avec une échéance pour rendre la prochaine étape du projet visible à toute l'équipe."
                  />
                )}
              </section>

              <section className="app-panel p-6">
                <p className="app-eyebrow">Next deliverable</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Prochain livrable attendu
                </h2>
                {nextDeliverable ? (
                  <div className="mt-5 rounded-[1.7rem] border border-slate-200 bg-white/92 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Point de livraison
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                      {nextDeliverable.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {nextDeliverable.description ??
                        "Cette preuve de travail sert de prochaine référence visible pour la room."}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Statut:{" "}
                        <span className="font-medium text-slate-900">
                          {deliverableStatusLabels[nextDeliverable.status]}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Tâche liée:{" "}
                        <span className="font-medium text-slate-900">
                          {nextDeliverable.taskTitle ?? "Aucune"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun livrable prioritaire"
                    description="Quand une première soumission est préparée, elle apparaîtra ici pour guider la prochaine étape."
                  />
                )}
              </section>
            </div>
          </div>

          <div className="space-y-6">
            <ProjectRoomRecentFeedback items={feedbackItems} />

            <section className="app-panel p-6">
              <p className="app-eyebrow">Blockers</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Blocages actuels
              </h2>
              {blockedTasks.length || overdueTasks.length ? (
                <div className="mt-5 space-y-4">
                  {blockedTasks.map((task) => (
                    <article key={task.id} className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                        Tâche bloquée
                      </p>
                      <h3 className="mt-2 font-semibold text-slate-950">{task.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {task.description ?? "Ajoutez un commentaire ou une décision de relecture pour relancer cette étape."}
                      </p>
                    </article>
                  ))}
                  {overdueTasks.map((task) => (
                    <article key={task.id} className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                        Échéance dépassée
                      </p>
                      <h3 className="mt-2 font-semibold text-slate-950">{task.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Prévue pour le {formatDate(task.dueDate)}. Replanifiez ou traitez cette tâche avant de charger le reste du flux.
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun blocage critique"
                  description="La room ne montre ni tâche bloquée ni échéance dépassée. Gardez le rythme avec les tâches en cours et les prochains livrables."
                />
              )}
            </section>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="app-panel p-6">
                <p className="app-eyebrow">Execution</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Tâches projet</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Le travail est regroupé par état pour rendre l&apos;avancement et les blocages lisibles.
                </p>
              </div>
              <ProjectTaskList
                projectId={room.project.id}
                canUpdateStatus={room.permissions.canUpdateTaskStatus}
                tasks={room.tasks}
              />
              {room.permissions.canManageTasks ? (
                <div className="space-y-4">
                  <div className="app-panel p-6">
                    <p className="app-eyebrow">Manage</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                      Gérer les tâches
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Ajoutez une nouvelle tâche ou mettez à jour les tâches existantes sans perdre la vue d&apos;ensemble.
                    </p>
                  </div>
                  <ProjectTaskForm projectId={room.project.id} />
                  {room.tasks.length ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {room.tasks.map((task) => (
                      <ProjectTaskForm key={task.id} projectId={room.project.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Aucune tâche à modifier"
                      description="Créez d'abord une tâche pour pouvoir l'ajuster ensuite."
                    />
                  )}
                </div>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="app-panel p-6">
                <p className="app-eyebrow">Preuves</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Livrables</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Les soumissions sont regroupées par étape pour distinguer préparation, attente de relecture et validation.
                </p>
              </div>
              <DeliverableList
                projectId={room.project.id}
                canReview={room.permissions.canReviewDeliverable}
                deliverables={room.deliverables}
              />
              {room.permissions.canSubmitDeliverable ? (
                <DeliverableForm
                  projectId={room.project.id}
                  tasks={room.tasks.map((task) => ({ id: task.id, title: task.title }))}
                />
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="app-panel p-6">
                <p className="app-eyebrow">Suivi</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Commentaires</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Conservez ici les décisions, clarifications et relances utiles pour le projet.
                </p>
              </div>
              <ProjectCommentList comments={room.comments} />
              {room.permissions.canComment ? (
                <ProjectCommentForm projectId={room.project.id} />
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <ProjectRoomActivityFeed items={activityItems} />
            <ProjectMembersList members={room.members} />
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
