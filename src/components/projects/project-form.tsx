"use client";

import { useActionState } from "react";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type ProjectActionState = {
  success: string | null;
  error: string | null;
};

const DEFAULT_PROJECT_ACTION_STATE: ProjectActionState = {
  success: null,
  error: null,
};

type ProjectCompanyOption = {
  id: string;
  name: string;
};

type ProjectFormAction = (
  state: ProjectActionState,
  formData: FormData,
) => Promise<ProjectActionState>;

type ProjectFormProps = {
  action: ProjectFormAction;
  submitLabel: string;
  companies: ProjectCompanyOption[];
  initialValues: {
    projectId?: string;
    title: string;
    summary: string;
    description: string;
    type: "FICTIONAL" | "REAL";
    status: "DRAFT" | "OPEN" | "CLOSED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
    targetLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
    companyId: string;
    capacity: number;
    startDate: string;
    endDate: string;
    requiredSkillsInput: string;
  };
};

export function ProjectForm({
  action,
  submitLabel,
  companies,
  initialValues,
}: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    DEFAULT_PROJECT_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.projectId ? (
        <input type="hidden" name="projectId" value={initialValues.projectId} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="title" label="Titre" helperText="Un titre explicite et facilement reperable dans les dashboards.">
          <input
            id="title"
            name="title"
            defaultValue={initialValues.title}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="summary" label="Resume" helperText="2 a 3 phrases qui donnent envie de comprendre le projet.">
          <input
            id="summary"
            name="summary"
            defaultValue={initialValues.summary}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField
        htmlFor="description"
        label="Description"
        helperText="Précisez le contexte, la valeur attendue et la façon dont l'étudiant progressera."
      >
        <textarea
          id="description"
          name="description"
          rows={7}
          defaultValue={initialValues.description}
          required
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <FormField htmlFor="type" label="Type" helperText="Projet pédagogique ou mission réelle.">
          <select
            id="type"
            name="type"
            defaultValue={initialValues.type}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="FICTIONAL">Fictif</option>
            <option value="REAL">Reel</option>
          </select>
        </FormField>
        <FormField htmlFor="status" label="Statut" helperText="Controle sa visibilite et l'ouverture aux candidatures.">
          <select
            id="status"
            name="status"
            defaultValue={initialValues.status}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </FormField>
        <FormField htmlFor="targetLevel" label="Niveau requis" helperText="Aide à filtrer les candidatures côté étudiant.">
          <select
            id="targetLevel"
            name="targetLevel"
            defaultValue={initialValues.targetLevel}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="LEVEL_1">Niveau 1</option>
            <option value="LEVEL_2">Niveau 2</option>
            <option value="LEVEL_3">Niveau 3</option>
          </select>
        </FormField>
        <FormField htmlFor="capacity" label="Capacite" helperText="Nombre de membres attendus sur le projet.">
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={50}
            defaultValue={initialValues.capacity}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField
        htmlFor="companyId"
        label="Entreprise partenaire"
        helperText="Renseignez-la pour les projets réels reliés à une entreprise."
      >
        <select
          id="companyId"
          name="companyId"
          defaultValue={initialValues.companyId}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        >
          <option value="">Aucune</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="startDate" label="Date de debut">
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={initialValues.startDate}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="endDate" label="Date de fin" helperText="Utile pour la priorisation des deadlines et le pilotage.">
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={initialValues.endDate}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>

      <FormField
        htmlFor="requiredSkillsInput"
        label="Competences requises"
        helperText="Une competence par ligne ou separee par des virgules."
      >
        <textarea
          id="requiredSkillsInput"
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

      <SubmitButton pending={pending} idleLabel={submitLabel} pendingLabel="Enregistrement..." />
    </form>
  );
}
