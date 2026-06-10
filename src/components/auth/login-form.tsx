"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { DEFAULT_AUTH_ACTION_STATE } from "@/lib/auth/action-state";
import { AUTH_INPUT_CLASS_NAME, AUTH_PANEL_CLASS_NAME } from "@/components/auth/auth-form-classes";
import { LinkButton } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-actions";
import { FormSection } from "@/components/ui/form-section";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, DEFAULT_AUTH_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormSection
        title="Vos identifiants"
        description="Utilisez l’adresse rattachée à votre compte plateforme. Les permissions restent vérifiées côté serveur."
        className={AUTH_PANEL_CLASS_NAME}
      >
        <div className="space-y-5">
          <FormField
            htmlFor="email"
            label="Adresse email"
            helperText="Étudiant, superviseur, entreprise ou admin selon votre accès."
          >
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nom@organisation.local"
              className={AUTH_INPUT_CLASS_NAME}
            />
          </FormField>
          <FormField
            htmlFor="password"
            label="Mot de passe"
            helperText="Votre session reste protégée et gérée par la plateforme."
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Votre mot de passe"
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
          idleLabel="Se connecter"
          pendingLabel="Connexion..."
          className="w-full sm:flex-1"
        />
        <LinkButton href="/register" variant="secondary" className="w-full sm:w-auto">
          Inscription étudiant
        </LinkButton>
      </FormActions>
    </form>
  );
}
