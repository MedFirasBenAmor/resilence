"use client";

import { useActionState } from "react";
import { ApplicationStatus } from "@prisma/client";
import {
  acceptApplicationAction,
  applyToProjectAction,
  rejectApplicationAction,
  withdrawApplicationAction,
} from "@/actions/applicationActions";
import { DEFAULT_APPLICATION_ACTION_STATE } from "@/actions/applicationActionState";
import { ApplicationStatusBadge } from "@/components/projects/application-status-badge";
import { Button } from "@/components/ui/button";

type StudentApplicationActionsProps = {
  mode: "student";
  projectId: string;
  applicationId?: string;
  applicationStatus?: ApplicationStatus | null;
};

type ReviewerApplicationActionsProps = {
  mode: "review";
  applicationId: string;
  applicationStatus: ApplicationStatus;
};

type ApplicationActionsProps =
  | StudentApplicationActionsProps
  | ReviewerApplicationActionsProps;

function StudentApplicationActions(props: StudentApplicationActionsProps) {
  const [applyState, applyAction, applyPending] = useActionState(
    applyToProjectAction,
    DEFAULT_APPLICATION_ACTION_STATE,
  );
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(
    withdrawApplicationAction,
    DEFAULT_APPLICATION_ACTION_STATE,
  );

  return (
    <div className="app-panel p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Candidature
      </p>

      {props.applicationStatus ? (
        <div className="mt-4 space-y-4">
          <ApplicationStatusBadge status={props.applicationStatus} />

          {props.applicationStatus === ApplicationStatus.PENDING && props.applicationId ? (
            <form action={withdrawAction} className="space-y-3">
              <input type="hidden" name="applicationId" value={props.applicationId} />
              <input type="hidden" name="projectId" value={props.projectId} />
              {withdrawState.error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {withdrawState.error}
                </p>
              ) : null}
              {withdrawState.success ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {withdrawState.success}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={withdrawPending}
                variant="secondary"
              >
                {withdrawPending ? "Retrait…" : "Retirer la candidature"}
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <form action={applyAction} className="mt-4 space-y-4">
          <input type="hidden" name="projectId" value={props.projectId} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="motivation">
              Motivation
            </label>
            <textarea
              id="motivation"
              name="motivation"
              rows={5}
              required
              className="w-full rounded-[1.45rem] border border-slate-300 px-4 py-3 text-slate-950"
            />
          </div>

          {applyState.error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {applyState.error}
            </p>
          ) : null}
          {applyState.success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {applyState.success}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={applyPending}
          >
            {applyPending ? "Envoi…" : "Candidater"}
          </Button>
        </form>
      )}
    </div>
  );
}

function ReviewerApplicationActions(props: ReviewerApplicationActionsProps) {
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptApplicationAction,
    DEFAULT_APPLICATION_ACTION_STATE,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectApplicationAction,
    DEFAULT_APPLICATION_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <ApplicationStatusBadge status={props.applicationStatus} />

      {props.applicationStatus === ApplicationStatus.PENDING ||
      props.applicationStatus === ApplicationStatus.SHORTLISTED ? (
        <div className="flex flex-wrap gap-3">
          <form action={acceptAction}>
            <input type="hidden" name="applicationId" value={props.applicationId} />
            <Button
              type="submit"
              disabled={acceptPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {acceptPending ? "Acceptation…" : "Accepter"}
            </Button>
          </form>

          <form action={rejectAction}>
            <input type="hidden" name="applicationId" value={props.applicationId} />
            <Button
              type="submit"
              disabled={rejectPending}
              variant="danger"
            >
              {rejectPending ? "Refus…" : "Rejeter"}
            </Button>
          </form>
        </div>
      ) : null}

      {acceptState.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {acceptState.error}
        </p>
      ) : null}
      {acceptState.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {acceptState.success}
        </p>
      ) : null}
      {rejectState.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {rejectState.error}
        </p>
      ) : null}
      {rejectState.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {rejectState.success}
        </p>
      ) : null}
    </div>
  );
}

export function ApplicationActions(props: ApplicationActionsProps) {
  if (props.mode === "student") {
    return <StudentApplicationActions {...props} />;
  }

  return <ReviewerApplicationActions {...props} />;
}
