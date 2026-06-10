"use client";

import { useActionState } from "react";
import { submitDeliverableAction } from "@/actions/projectRoomActions";
import {
  DEFAULT_PROJECT_ROOM_ACTION_STATE,
  type ProjectRoomActionState,
} from "@/actions/projectRoomActionState";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type DeliverableFormProps = {
  projectId: string;
  tasks: Array<{
    id: string;
    title: string;
  }>;
};

export function DeliverableForm({ projectId, tasks }: DeliverableFormProps) {
  const [state, formAction, pending] = useActionState<ProjectRoomActionState, FormData>(
    submitDeliverableAction,
    DEFAULT_PROJECT_ROOM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="projectId" value={projectId} />
      <h2 className="text-lg font-semibold text-slate-950">Soumettre un livrable</h2>

      <FormField htmlFor="deliverable-title" label="Titre" helperText="Intitulé court et clair pour retrouver vite la soumission.">
        <input
          id="deliverable-title"
          name="title"
          placeholder="Ex: Sprint 2 - API auth"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>
      <FormField htmlFor="deliverable-description" label="Description" helperText="Ce que vous livrez, ce qui est inclus et ce qu'il faut verifier.">
        <textarea
          id="deliverable-description"
          name="description"
          rows={4}
          placeholder="Description"
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>
      <FormField htmlFor="deliverable-task" label="Tâche liée" helperText="Optionnel, utile pour relier la soumission à une tâche de la room.">
        <select
          id="deliverable-task"
          name="taskId"
          defaultValue=""
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
        >
          <option value="">Aucune tâche liée</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="submissionUrl" label="URL du livrable" helperText="Lien obligatoire vers la ressource à relire.">
        <input
          id="submissionUrl"
          name="submissionUrl"
          type="url"
          placeholder="https://..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>
      <FormField htmlFor="repositoryUrl" label="URL du dépôt" helperText="Optionnel si le livrable pointe déjà vers un dépôt ou une démo.">
        <input
          id="repositoryUrl"
          name="repositoryUrl"
          type="url"
          placeholder="Repository URL optionnelle"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

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

      <SubmitButton pending={pending} idleLabel="Soumettre" pendingLabel="Soumission..." />
    </form>
  );
}
