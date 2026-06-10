"use client";

import { useActionState } from "react";
import { submitCompanyProjectRequestAction } from "@/actions/projectRequestActions";
import { DEFAULT_PROJECT_REQUEST_ACTION_STATE } from "@/actions/projectRequestActionState";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function CompanyProjectRequestForm() {
  const [state, formAction, pending] = useActionState(
    submitCompanyProjectRequestAction,
    DEFAULT_PROJECT_REQUEST_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Soumettre un cahier de charge</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          MVP: le depot du cahier de charge passe temporairement par une URL PDF securisee ou un lien
          de document partage.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="request-title" label="Titre">
          <input
            id="request-title"
            name="title"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="request-domain" label="Domaine / categorie">
          <input
            id="request-domain"
            name="domain"
            required
            placeholder="Ex: SaaS logistique, ESG reporting, EdTech"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField htmlFor="request-summary" label="Resume court">
        <textarea
          id="request-summary"
          name="shortSummary"
          rows={4}
          required
          placeholder="Contexte metier, probleme a resoudre et valeur attendue."
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

      <div className="grid gap-5 md:grid-cols-3">
        <FormField htmlFor="request-level" label="Niveau cible">
          <select
            id="request-level"
            name="desiredLevel"
            defaultValue="LEVEL_2"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="LEVEL_1">Niveau 1</option>
            <option value="LEVEL_2">Niveau 2</option>
            <option value="LEVEL_3">Niveau 3</option>
          </select>
        </FormField>
        <FormField htmlFor="request-team-size" label="Taille d'équipe attendue">
          <input
            id="request-team-size"
            name="expectedTeamSize"
            type="number"
            min={1}
            max={20}
            defaultValue={3}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="request-duration" label="Duree estimee">
          <input
            id="request-duration"
            name="estimatedDuration"
            required
            placeholder="Ex: 6 semaines"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField
        htmlFor="request-spec-book"
        label="URL du cahier de charge PDF"
        helperText="MVP temporaire en attendant un vrai stockage fichiers. Utilisez un lien direct ou partageable vers votre cahier de charge."
      >
        <input
          id="request-spec-book"
          name="specBookUrl"
          type="url"
          required
          placeholder="https://..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

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

      <SubmitButton pending={pending} idleLabel="Soumettre le cahier de charge" pendingLabel="Soumission..." />
    </form>
  );
}
