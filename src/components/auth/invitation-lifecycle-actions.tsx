"use client";

import { useActionState } from "react";
import { DEFAULT_INVITATION_LIFECYCLE_ACTION_STATE } from "@/actions/invitationActionState";
import {
  expireRoleInvitationAction,
  revokeRoleInvitationAction,
} from "@/actions/invitationActions";
import { SubmitButton } from "@/components/ui/submit-button";

type InvitationLifecycleActionsProps = {
  invitationId: string;
  canExpire: boolean;
  canRevoke: boolean;
};

export function InvitationLifecycleActions({
  invitationId,
  canExpire,
  canRevoke,
}: InvitationLifecycleActionsProps) {
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeRoleInvitationAction,
    DEFAULT_INVITATION_LIFECYCLE_ACTION_STATE,
  );
  const [expireState, expireAction, expirePending] = useActionState(
    expireRoleInvitationAction,
    DEFAULT_INVITATION_LIFECYCLE_ACTION_STATE,
  );

  if (!canExpire && !canRevoke) {
    return <p className="text-xs text-slate-500">Aucune action disponible.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canExpire ? (
          <form action={expireAction}>
            <input type="hidden" name="invitationId" value={invitationId} />
            <SubmitButton
              pending={expirePending}
              idleLabel="Expirer"
              pendingLabel="Expiration..."
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            />
          </form>
        ) : null}
        {canRevoke ? (
          <form action={revokeAction}>
            <input type="hidden" name="invitationId" value={invitationId} />
            <SubmitButton
              pending={revokePending}
              idleLabel="Revoquer"
              pendingLabel="Revocation..."
              className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            />
          </form>
        ) : null}
      </div>
      {revokeState.error ? <p className="text-xs text-rose-700">{revokeState.error}</p> : null}
      {expireState.error ? <p className="text-xs text-rose-700">{expireState.error}</p> : null}
      {revokeState.success ? <p className="text-xs text-emerald-700">{revokeState.success}</p> : null}
      {expireState.success ? <p className="text-xs text-emerald-700">{expireState.success}</p> : null}
    </div>
  );
}
