"use client";

import { useActionState } from "react";
import { acceptRoleInvitationAction } from "@/actions/invitationActions";
import { DEFAULT_INVITATION_ACTION_STATE } from "@/actions/invitationActionState";
import { AUTH_INPUT_CLASS_NAME, AUTH_PANEL_CLASS_NAME } from "@/components/auth/auth-form-classes";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SubmitButton } from "@/components/ui/submit-button";

type AcceptRoleInvitationFormProps = {
  token: string;
  email: string;
  roleLabel: string;
  companyName: string | null;
};

export function AcceptRoleInvitationForm({
  token,
  email,
  roleLabel,
  companyName,
}: AcceptRoleInvitationFormProps) {
  const [state, formAction, pending] = useActionState(
    acceptRoleInvitationAction,
    DEFAULT_INVITATION_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="next" value="/dashboard" />

      <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm leading-6 text-emerald-900">
        Cette invitation a été générée par un administrateur. Elle permet de créer un
        compte <span className="font-semibold">{roleLabel.toLowerCase()}</span> pour{" "}
        <span className="font-semibold">{email}</span>.
        {companyName ? <span> Organisation rattachée : {companyName}.</span> : null}
      </div>

      <FormSection
        title="Identite du compte"
        description="Ces informations seront utilisées pour créer votre accès professionnel."
        className={AUTH_PANEL_CLASS_NAME}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField htmlFor="invite-first-name" label="Prenom">
            <input
              id="invite-first-name"
              name="firstName"
              required
              placeholder="Karim"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
          <FormField htmlFor="invite-last-name" label="Nom">
            <input
              id="invite-last-name"
              name="lastName"
              required
              placeholder="Bensalem"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Mot de passe"
        description="Choisissez un mot de passe robuste pour finaliser l'activation."
        className={AUTH_PANEL_CLASS_NAME}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField htmlFor="invite-password" label="Mot de passe">
            <input
              id="invite-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Minimum 8 caracteres"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
          <FormField htmlFor="invite-confirm-password" label="Confirmation">
            <input
              id="invite-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repetez le mot de passe"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
        </div>
      </FormSection>

      {state.error ? (
        <p
          className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          aria-live="polite"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          aria-live="polite"
        >
          {state.success}
        </p>
      ) : null}

      <SubmitButton
        pending={pending}
        idleLabel="Activer mon compte"
        pendingLabel="Activation..."
        className="w-full"
      />
    </form>
  );
}
