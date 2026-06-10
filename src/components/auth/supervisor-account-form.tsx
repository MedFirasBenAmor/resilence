"use client";

import { useActionState } from "react";
import { DEFAULT_SUPERVISOR_ACTION_STATE } from "@/actions/supervisorActionState";
import { createSupervisorAccountAction } from "@/actions/supervisorActions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const INPUT_CLASS_NAME =
  "w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400";

export function SupervisorAccountForm() {
  const [state, formAction, pending] = useActionState(
    createSupervisorAccountAction,
    DEFAULT_SUPERVISOR_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Creer un superviseur</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Creez directement un compte superviseur actif sans passer par une invitation.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="supervisor-first-name" label="Prenom" error={state.fieldErrors.firstName}>
          <input id="supervisor-first-name" name="firstName" required className={INPUT_CLASS_NAME} />
        </FormField>
        <FormField htmlFor="supervisor-last-name" label="Nom" error={state.fieldErrors.lastName}>
          <input id="supervisor-last-name" name="lastName" required className={INPUT_CLASS_NAME} />
        </FormField>
        <FormField htmlFor="supervisor-email" label="Email" error={state.fieldErrors.email}>
          <input id="supervisor-email" name="email" type="email" required className={INPUT_CLASS_NAME} />
        </FormField>
        <FormField
          htmlFor="supervisor-password"
          label="Mot de passe"
          error={state.fieldErrors.password}
        >
          <input
            id="supervisor-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className={INPUT_CLASS_NAME}
          />
        </FormField>
        <FormField
          htmlFor="supervisor-confirm-password"
          label="Confirmation"
          error={state.fieldErrors.confirmPassword}
        >
          <input
            id="supervisor-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={INPUT_CLASS_NAME}
          />
        </FormField>
        <FormField htmlFor="supervisor-title" label="Titre" error={state.fieldErrors.title}>
          <input id="supervisor-title" name="title" className={INPUT_CLASS_NAME} />
        </FormField>
        <FormField
          htmlFor="supervisor-department"
          label="Departement"
          error={state.fieldErrors.department}
        >
          <input id="supervisor-department" name="department" className={INPUT_CLASS_NAME} />
        </FormField>
        <FormField
          htmlFor="supervisor-expertise"
          label="Domaine d'expertise"
          error={state.fieldErrors.expertiseArea}
        >
          <input id="supervisor-expertise" name="expertiseArea" className={INPUT_CLASS_NAME} />
        </FormField>
        <FormField
          htmlFor="supervisor-organization"
          label="Organisation"
          error={state.fieldErrors.organization}
        >
          <input id="supervisor-organization" name="organization" className={INPUT_CLASS_NAME} />
        </FormField>
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

      <SubmitButton pending={pending} idleLabel="Creer le compte" pendingLabel="Creation..." />
    </form>
  );
}
