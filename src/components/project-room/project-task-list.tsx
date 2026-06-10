"use client";

import { useActionState } from "react";
import { updateProjectTaskStatusAction } from "@/actions/projectRoomActions";
import {
  DEFAULT_PROJECT_ROOM_ACTION_STATE,
  type ProjectRoomActionState,
} from "@/actions/projectRoomActionState";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectTaskStatusBadge } from "@/components/project-room/project-task-status-badge";

type TaskStatusValue = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type ProjectTaskListProps = {
  projectId: string;
  canUpdateStatus: boolean;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatusValue;
    dueDate: Date | null;
    completedAt: Date | null;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

function TaskStatusForm({
  projectId,
  taskId,
  status,
}: {
  projectId: string;
  taskId: string;
  status: TaskStatusValue;
}) {
  const [state, formAction, pending] = useActionState<ProjectRoomActionState, FormData>(
    updateProjectTaskStatusAction,
    DEFAULT_PROJECT_ROOM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={status}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
      >
        <option value="TODO">TODO</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="DONE">DONE</option>
        <option value="BLOCKED">BLOCKED</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:opacity-60"
      >
        {pending ? "..." : "Appliquer"}
      </button>
      {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

export function ProjectTaskList({
  projectId,
  canUpdateStatus,
  tasks,
}: ProjectTaskListProps) {
  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const activeTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS" || task.status === "BLOCKED",
  );
  const completedTasks = tasks.filter((task) => task.status === "DONE");

  if (!tasks.length) {
    return (
      <EmptyState
        title="Aucune tâche"
        description="Commencez par créer les premières tâches de la mission pour rendre le plan d'exécution visible."
      />
    );
  }

  const groups = [
    {
      id: "todo",
      title: "À faire",
      description: "Les prochaines actions à lancer.",
      tasks: todoTasks,
    },
    {
      id: "active",
      title: "En cours",
      description: "Le travail actif et les éléments qui peuvent bloquer l'équipe.",
      tasks: activeTasks,
    },
    {
      id: "done",
      title: "Terminées",
      description: "Ce qui a déjà été clôturé dans la room.",
      tasks: completedTasks,
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
              {group.tasks.length} tâche{group.tasks.length > 1 ? "s" : ""}
            </span>
          </div>

          {group.tasks.length ? (
            <div className="mt-5 space-y-4">
              {group.tasks.map((task) => (
                <article key={task.id} className="rounded-[1.55rem] border border-slate-200/90 bg-white/92 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                        {task.title}
                      </h3>
                      {task.description ? (
                        <p className="mt-3 text-sm leading-7 text-slate-700">{task.description}</p>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          Ajoutez une description pour clarifier ce qui est attendu.
                        </p>
                      )}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          Échéance:{" "}
                          <span className="font-medium text-slate-900">{formatDate(task.dueDate)}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                          Clôture:{" "}
                          <span className="font-medium text-slate-900">
                            {formatDate(task.completedAt)}
                          </span>
                        </div>
                      </div>

                      {task.status === "BLOCKED" ? (
                        <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                          Cette tâche est bloquée. Utilisez les commentaires ou la relecture d&apos;un livrable pour débloquer la suite.
                        </div>
                      ) : null}
                    </div>
                    <ProjectTaskStatusBadge status={task.status} />
                  </div>

                  {canUpdateStatus ? (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <TaskStatusForm projectId={projectId} taskId={task.id} status={task.status} />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-5 text-sm leading-6 text-slate-600">
              Rien à afficher dans cette colonne pour le moment. Le prochain mouvement du projet apparaîtra ici.
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
