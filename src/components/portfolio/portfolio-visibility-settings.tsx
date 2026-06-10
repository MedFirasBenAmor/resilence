"use client";

import { useActionState } from "react";
import { updatePortfolioVisibilityAction } from "@/actions/portfolioActions";
import { DEFAULT_PORTFOLIO_ACTION_STATE } from "@/actions/portfolioActionState";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type PortfolioVisibilitySettingsProps = {
  isPortfolioPublic: boolean;
  portfolioSlug: string | null;
  publicPortfolioPath: string | null;
};

export function PortfolioVisibilitySettings({
  isPortfolioPublic,
  portfolioSlug,
  publicPortfolioPath,
}: PortfolioVisibilitySettingsProps) {
  const [state, formAction, pending] = useActionState(
    updatePortfolioVisibilityAction,
    DEFAULT_PORTFOLIO_ACTION_STATE,
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold text-slate-950">Visibilite publique</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Activez une version partageable de votre portfolio uniquement quand vos
          informations sont pretes a etre diffusees.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <input
            type="checkbox"
            name="isPortfolioPublic"
            defaultChecked={isPortfolioPublic}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-sky-500"
          />
          <div>
            <span className="text-sm font-semibold text-slate-900">
              Rendre le portfolio public
            </span>
            <p className="mt-1 text-sm text-slate-600">
              Si activée, la page publique n&apos;exposera ni feedbacks privés ni données
              sensibles non necessaires.
            </p>
          </div>
        </label>

        <FormField
          htmlFor="portfolioSlug"
          label="Slug public"
          helperText="Exemple: amal-bensaid. Utilisez seulement des minuscules, chiffres et tirets."
        >
          <input
            id="portfolioSlug"
            name="portfolioSlug"
            defaultValue={portfolioSlug ?? ""}
            placeholder="prenom-nom"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>

        {publicPortfolioPath ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Lien public actif: <span className="font-semibold">{publicPortfolioPath}</span>
          </div>
        ) : null}

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

        <SubmitButton
          pending={pending}
          idleLabel="Mettre a jour la visibilite"
          pendingLabel="Mise a jour..."
        />
      </form>
    </section>
  );
}
