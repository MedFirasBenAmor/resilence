"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/auth/actions";
import { DEFAULT_AUTH_ACTION_STATE } from "@/lib/auth/action-state";
import { AUTH_INPUT_CLASS_NAME, AUTH_PANEL_CLASS_NAME } from "@/components/auth/auth-form-classes";
import { LinkButton } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-actions";
import { FormSection } from "@/components/ui/form-section";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, DEFAULT_AUTH_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role" value="STUDENT" />
      <FormSection
        title="Identité du compte"
        description="Ce formulaire crée uniquement un compte étudiant. Les accès superviseur et entreprise passent par invitation admin."
        className={AUTH_PANEL_CLASS_NAME}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="firstName" label="Prénom">
            <input
              id="firstName"
              name="firstName"
              required
              placeholder="Amina"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
          <FormField htmlFor="lastName" label="Nom">
            <input
              id="lastName"
              name="lastName"
              required
              placeholder="Bensalem"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
        </div>
        <div className="mt-4 space-y-5">
          <FormField
            htmlFor="email"
            label="Adresse email"
            helperText="Choisissez une adresse durable pour vos candidatures, feedbacks et attestations."
          >
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="amina@campus.local"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
        </div>
      </FormSection>
      <FormSection
        title="Sécurité de connexion"
        description="Choisissez un mot de passe robuste et confirmez-le avant de poursuivre."
        className={AUTH_PANEL_CLASS_NAME}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="password"
            label="Mot de passe"
            helperText="Choisissez un mot de passe robuste pour un compte durable."
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Minimum 8 caractères"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
          <FormField
            htmlFor="confirmPassword"
            label="Confirmation"
            helperText="Répétez exactement le mot de passe choisi."
          >
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Répétez le mot de passe"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
        </div>
      </FormSection>
      {state.error ? (
        <p
          className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          aria-live="polite"
        >
          {state.error}
        </p>
      ) : null}
      <FormActions className="flex-col sm:flex-row">
        <SubmitButton
          pending={pending}
          idleLabel="Créer mon compte étudiant"
          pendingLabel="Création…"
          className="w-full sm:flex-1"
        />
        <LinkButton href="/login" variant="secondary" className="w-full sm:w-auto">
          J’ai déjà un compte
        </LinkButton>
      </FormActions>
    </form>
  );
}
