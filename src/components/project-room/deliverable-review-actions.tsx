"use client";

import { useActionState } from "react";
import { reviewDeliverableAction } from "@/actions/projectRoomActions";
import {
  DEFAULT_PROJECT_ROOM_ACTION_STATE,
  type ProjectRoomActionState,
} from "@/actions/projectRoomActionState";

type DeliverableReviewStatus = "REVIEWED" | "APPROVED" | "REJECTED";

type DeliverableReviewActionsProps = {
  projectId: string;
  deliverableId: string;
};

export function DeliverableReviewActions({
  projectId,
  deliverableId,
}: DeliverableReviewActionsProps) {
  const [state, formAction, pending] = useActionState<ProjectRoomActionState, FormData>(
    reviewDeliverableAction,
    DEFAULT_PROJECT_ROOM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="deliverableId" value={deliverableId} />
      <select
        name="status"
        defaultValue={"REVIEWED" as DeliverableReviewStatus}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950"
      >
        <option value="REVIEWED">REVIEWED</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
      </select>
      <textarea
        name="reviewComment"
        rows={3}
        placeholder="Commentaire de relecture optionnel"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950"
      />
      {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
      >
        {pending ? "Review..." : "Mettre a jour"}
      </button>
    </form>
  );
}
