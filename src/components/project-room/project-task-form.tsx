"use client";

import { useActionState } from "react";
import {
  createProjectTaskAction,
  updateProjectTaskAction,
} from "@/actions/projectRoomActions";
import {
  DEFAULT_PROJECT_ROOM_ACTION_STATE,
  type ProjectRoomActionState,
} from "@/actions/projectRoomActionState";

type TaskStatusValue = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type ProjectTaskFormProps = {
  projectId: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatusValue;
    dueDate: Date | null;
  };
};

function formatDateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function ProjectTaskForm({ projectId, task }: ProjectTaskFormProps) {
  const action = task ? updateProjectTaskAction : createProjectTaskAction;
  const [state, formAction, pending] = useActionState<ProjectRoomActionState, FormData>(
    action,
    DEFAULT_PROJECT_ROOM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="projectId" value={projectId} />
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}

      <h2 className="text-lg font-semibold text-slate-950">
        {task ? "Modifier une tâche" : "Ajouter une tâche"}
      </h2>

      <input
        name="title"
        defaultValue={task?.title ?? ""}
        placeholder="Titre de la tâche"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
      />
      <textarea
        name="description"
        defaultValue={task?.description ?? ""}
        rows={4}
        placeholder="Description"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="dueDate"
          type="date"
          defaultValue={formatDateInput(task?.dueDate ?? null)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
        />
        <select
          name="status"
          defaultValue={task?.status ?? "TODO"}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
        >
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : task ? "Mettre à jour" : "Créer la tâche"}
      </button>
    </form>
  );
}
