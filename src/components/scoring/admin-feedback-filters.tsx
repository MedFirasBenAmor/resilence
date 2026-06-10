import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-actions";
import { FormField } from "@/components/ui/form-field";

type AdminFeedbackFiltersProps = {
  filters: {
    projectId: string;
    studentId: string;
    evaluatorId: string;
    query: string;
    lowScoreOnly: boolean;
    dateFrom: string;
    dateTo: string;
  };
};

export function AdminFeedbackFilters({ filters }: AdminFeedbackFiltersProps) {
  return (
    <form className="app-panel grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
      <FormField label="Recherche" helperText="Titre, commentaire ou contexte.">
        <input
          name="query"
          defaultValue={filters.query}
          placeholder="Recherche texte"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 transition focus:border-sky-400 focus:outline-none"
        />
      </FormField>
      <FormField label="Projet" helperText="Identifiant projet si besoin.">
        <input
          name="projectId"
          defaultValue={filters.projectId}
          placeholder="Project ID"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 transition focus:border-sky-400 focus:outline-none"
        />
      </FormField>
      <FormField label="Étudiant" helperText="Filtrer par étudiant.">
        <input
          name="studentId"
          defaultValue={filters.studentId}
          placeholder="Student ID"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 transition focus:border-sky-400 focus:outline-none"
        />
      </FormField>
      <FormField label="Evaluateur" helperText="Filtrer par evaluateur.">
        <input
          name="evaluatorId"
          defaultValue={filters.evaluatorId}
          placeholder="Evaluator ID"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 transition focus:border-sky-400 focus:outline-none"
        />
      </FormField>
      <FormField label="Depuis" helperText="Date de debut.">
        <input
          name="dateFrom"
          type="date"
          defaultValue={filters.dateFrom}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 transition focus:border-sky-400 focus:outline-none"
        />
      </FormField>
      <FormField label="Jusqu'au" helperText="Date de fin.">
        <input
          name="dateTo"
          type="date"
          defaultValue={filters.dateTo}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 transition focus:border-sky-400 focus:outline-none"
        />
      </FormField>
      <FormField label="Alerte" helperText="Limiter aux situations à surveiller.">
        <label className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="lowScoreOnly"
            value="true"
            defaultChecked={filters.lowScoreOnly}
            className="h-4 w-4 rounded border-slate-300"
          />
          Afficher seulement les scores faibles
        </label>
      </FormField>
      <FormActions className="xl:col-span-4">
        <Button type="submit">Filtrer</Button>
      </FormActions>
    </form>
  );
}
