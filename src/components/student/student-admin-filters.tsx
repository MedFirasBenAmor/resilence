import { AcademicValidationStatus, StudentLevel } from "@prisma/client";
import { Button, LinkButton } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-actions";
import { FormField } from "@/components/ui/form-field";

type StudentAdminFiltersProps = {
  query: string;
  level: StudentLevel | "";
  status: AcademicValidationStatus | "";
};

export function StudentAdminFilters({
  query,
  level,
  status,
}: StudentAdminFiltersProps) {
  return (
    <form className="app-panel grid gap-4 p-5 md:grid-cols-4">
      <FormField
        htmlFor="query"
        label="Recherche nom ou email"
        helperText="Cherchez un profil par nom, prenom ou email."
        className="md:col-span-2"
      >
        <input
          id="query"
          name="query"
          defaultValue={query}
          placeholder="Ex. Amal, Haddad ou demo.resilience.local"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950"
        />
      </FormField>
      <FormField htmlFor="level" label="Niveau" helperText="Filtrer par niveau declare.">
        <select
          id="level"
          name="level"
          defaultValue={level}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950"
        >
          <option value="">Tous</option>
          <option value={StudentLevel.LEVEL_1}>Niveau 1</option>
          <option value={StudentLevel.LEVEL_2}>Niveau 2</option>
          <option value={StudentLevel.LEVEL_3}>Niveau 3</option>
        </select>
      </FormField>
      <FormField htmlFor="status" label="Validation" helperText="Filtrer par statut académique.">
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950"
        >
          <option value="">Tous</option>
          <option value={AcademicValidationStatus.PENDING}>En attente</option>
          <option value={AcademicValidationStatus.IN_REVIEW}>En revue</option>
          <option value={AcademicValidationStatus.VALIDATED}>Valide</option>
          <option value={AcademicValidationStatus.REJECTED}>Rejete</option>
        </select>
      </FormField>
      <FormActions>
        <Button type="submit">
          Filtrer
        </Button>
        <LinkButton href="/dashboard/admin/students" variant="secondary">
          Reinitialiser
        </LinkButton>
      </FormActions>
    </form>
  );
}
