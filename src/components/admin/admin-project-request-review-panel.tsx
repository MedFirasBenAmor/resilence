"use client";

import { CompanyProjectRequestStatus } from "@prisma/client";
import {
  approveProjectRequestAction,
  markProjectRequestUnderReviewAction,
  rejectProjectRequestAction,
} from "@/actions/projectRequestActions";
import { DEFAULT_PROJECT_REQUEST_ACTION_STATE } from "@/actions/projectRequestActionState";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

type AdminProjectRequestReviewPanelProps = {
  requestId: string;
  status: CompanyProjectRequestStatus;
  initialNote: string;
};

export function AdminProjectRequestReviewPanel({
  requestId,
  status,
  initialNote,
}: AdminProjectRequestReviewPanelProps) {
  const [reviewState, reviewAction, reviewPending] = useActionState(
    markProjectRequestUnderReviewAction,
    DEFAULT_PROJECT_REQUEST_ACTION_STATE,
  );
  const [approveState, approveAction, approvePending] = useActionState(
    approveProjectRequestAction,
    DEFAULT_PROJECT_REQUEST_ACTION_STATE,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectProjectRequestAction,
    DEFAULT_PROJECT_REQUEST_ACTION_STATE,
  );

  const state = rejectState.error || rejectState.success
    ? rejectState
    : approveState.error || approveState.success
      ? approveState
      : reviewState;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">Revue admin</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Faites passer la demande en revue, approuvez-la, ou rejetez-la avec une note exploitable.
      </p>

      <div className="mt-5 space-y-4">
        <form action={reviewAction} className="space-y-3">
          <input type="hidden" name="requestId" value={requestId} />
          <textarea
            name="note"
            defaultValue={initialNote}
            rows={4}
            placeholder="Note de revue admin"
            className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
          />
          <SubmitButton
            pending={reviewPending}
            idleLabel={status === CompanyProjectRequestStatus.UNDER_REVIEW ? "Mettre a jour la revue" : "Marquer en revue"}
            pendingLabel="Enregistrement..."
          />
        </form>

        <form action={approveAction} className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <input type="hidden" name="requestId" value={requestId} />
          <textarea
            name="note"
            defaultValue={initialNote}
            rows={3}
            placeholder="Note d'approbation admin"
            className="w-full rounded-[20px] border border-emerald-200 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-emerald-400"
          />
          <SubmitButton pending={approvePending} idleLabel="Approuver la demande" pendingLabel="Approbation..." />
        </form>

        <form action={rejectAction} className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <input type="hidden" name="requestId" value={requestId} />
          <textarea
            name="note"
            defaultValue={initialNote}
            rows={3}
            placeholder="Motif de rejet"
            className="w-full rounded-[20px] border border-rose-200 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-rose-400"
          />
          <SubmitButton pending={rejectPending} idleLabel="Rejeter la demande" pendingLabel="Rejet..." className="bg-rose-600 hover:bg-rose-700" />
        </form>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </section>
  );
}
