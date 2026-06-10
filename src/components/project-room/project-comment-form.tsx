"use client";

import { useActionState } from "react";
import { createProjectCommentAction } from "@/actions/projectRoomActions";
import {
  DEFAULT_PROJECT_ROOM_ACTION_STATE,
  type ProjectRoomActionState,
} from "@/actions/projectRoomActionState";

type ProjectCommentFormProps = {
  projectId: string;
};

export function ProjectCommentForm({ projectId }: ProjectCommentFormProps) {
  const [state, formAction, pending] = useActionState<ProjectRoomActionState, FormData>(
    createProjectCommentAction,
    DEFAULT_PROJECT_ROOM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="projectId" value={projectId} />
      <h2 className="text-lg font-semibold text-slate-950">Ajouter un commentaire</h2>
      <textarea
        name="body"
        rows={4}
        placeholder="Commentaire de suivi"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
      />
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
        {pending ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}
