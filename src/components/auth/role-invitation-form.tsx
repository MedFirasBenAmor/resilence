"use client";

import { useActionState, useState } from "react";
import { UserRole } from "@prisma/client";
import { createRoleInvitationAction } from "@/actions/invitationActions";
import { DEFAULT_INVITATION_ACTION_STATE } from "@/actions/invitationActionState";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function RoleInvitationForm() {
  const [role, setRole] = useState<UserRole>(UserRole.SUPERVISOR);
  const [state, formAction, pending] = useActionState(
    createRoleInvitationAction,
    DEFAULT_INVITATION_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Inviter un superviseur ou une entreprise</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          L&apos;invitation tient lieu d&apos;approbation admin pour les roles sensibles.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="invite-email" label="Email">
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="invite-role" label="Role">
          <select
            id="invite-role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value={UserRole.SUPERVISOR}>Superviseur</option>
            <option value={UserRole.COMPANY}>Entreprise</option>
          </select>
        </FormField>
      </div>

      {role === UserRole.COMPANY ? (
        <FormField htmlFor="invite-company-name" label="Entreprise">
          <input
            id="invite-company-name"
            name="companyName"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      ) : null}

      <FormField htmlFor="invite-expiry" label="Expiration (jours)">
        <input
          id="invite-expiry"
          name="expiresInDays"
          type="number"
          min={1}
          max={30}
          defaultValue={7}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p>{state.success}</p>
          {state.invitePath ? (
            <p className="mt-2 break-all font-medium text-emerald-800">{state.invitePath}</p>
          ) : null}
        </div>
      ) : null}

      <SubmitButton pending={pending} idleLabel="Creer l'invitation" pendingLabel="Creation..." />
    </form>
  );
}
