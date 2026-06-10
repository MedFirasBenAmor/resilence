"use client";

import { useActionState } from "react";
import { convertProjectRequestToProjectAction } from "@/actions/projectRequestActions";
import { DEFAULT_PROJECT_REQUEST_ACTION_STATE } from "@/actions/projectRequestActionState";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type ConvertProjectRequestFormProps = {
  requestId: string;
  initialValues: {
    title: string;
    summary: string;
    description: string;
    targetLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
    capacity: number;
    requiredSkillsInput: string;
    startDate: string;
    endDate: string;
  };
};

export function ConvertProjectRequestForm({
  requestId,
  initialValues,
}: ConvertProjectRequestFormProps) {
  const [state, formAction, pending] = useActionState(
    convertProjectRequestToProjectAction,
    DEFAULT_PROJECT_REQUEST_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="requestId" value={requestId} />

      <div>
        <h2 className="text-xl font-semibold text-slate-950">Convertir en projet publie</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          La demande sera convertie en projet réel publié. Complétez les champs MVP disponibles avant conversion.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="convert-title" label="Titre projet">
          <input
            id="convert-title"
            name="title"
            defaultValue={initialValues.title}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="convert-summary" label="Resume projet">
          <input
            id="convert-summary"
            name="summary"
            defaultValue={initialValues.summary}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField htmlFor="convert-description" label="Description complete">
        <textarea
          id="convert-description"
          name="description"
          rows={8}
          defaultValue={initialValues.description}
          required
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <FormField htmlFor="convert-target-level" label="Niveau cible">
          <select
            id="convert-target-level"
            name="targetLevel"
            defaultValue={initialValues.targetLevel}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="LEVEL_1">Niveau 1</option>
            <option value="LEVEL_2">Niveau 2</option>
            <option value="LEVEL_3">Niveau 3</option>
          </select>
        </FormField>
        <FormField htmlFor="convert-capacity" label="Capacite">
          <input
            id="convert-capacity"
            name="capacity"
            type="number"
            min={1}
            max={50}
            defaultValue={initialValues.capacity}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="convert-start-date" label="Debut">
          <input
            id="convert-start-date"
            name="startDate"
            type="date"
            defaultValue={initialValues.startDate}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="convert-end-date" label="Fin">
          <input
            id="convert-end-date"
            name="endDate"
            type="date"
            defaultValue={initialValues.endDate}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField htmlFor="convert-skills" label="Competences requises">
        <textarea
          id="convert-skills"
          name="requiredSkillsInput"
          rows={4}
          defaultValue={initialValues.requiredSkillsInput}
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
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

      <SubmitButton pending={pending} idleLabel="Convertir en projet" pendingLabel="Conversion..." />
    </form>
  );
}
