import React from "react";
import Link from "next/link";
import { ApplicationStatus, ProjectType, StudentLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  applicationStatusLabels,
  levelLabels,
  projectTypeLabels,
} from "@/lib/ui/status-labels";
import {
  hasActiveStudentProjectFilters,
  type StudentProjectAvailability,
  type StudentProjectDiscoveryFilters,
  type StudentProjectSort,
} from "@/lib/project-discovery";

type ProjectFiltersProps = {
  actionPath: string;
  values: Partial<StudentProjectDiscoveryFilters> & {
    query?: string;
    status?: string;
  };
  resultCount?: number;
  showLevel?: boolean;
  showStatus?: boolean;
};

const availabilityLabels: Record<Exclude<StudentProjectAvailability, "">, string> = {
  AVAILABLE: "Places disponibles",
  FULL: "Complet",
};

const sortLabels: Record<StudentProjectSort, string> = {
  RECENT: "Plus récent",
  DEADLINE: "Date limite la plus proche",
  LEVEL: "Niveau",
  AVAILABLE_PLACES: "Places disponibles",
};

export function ProjectFilters({
  actionPath,
  values,
  resultCount,
  showLevel = true,
  showStatus = false,
}: ProjectFiltersProps) {
  const normalizedValues: StudentProjectDiscoveryFilters = {
    search: values.search ?? values.query ?? "",
    type: values.type ?? "",
    level: values.level ?? "",
    skills: values.skills ?? "",
    availability: values.availability ?? "",
    applicationStatus: values.applicationStatus ?? "",
    sort: values.sort ?? "RECENT",
    page: values.page ?? 1,
  };
  const hasActiveFilters = hasActiveStudentProjectFilters(normalizedValues);

  return (
    <section className="space-y-4">
      <form
        action={actionPath}
        method="get"
        className="app-panel space-y-5 rounded-[1.9rem] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Filtres catalogue
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {resultCount ?? 0} projet(s) trouvé(s)
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Recherchez, filtrez et triez uniquement sur des données réelles du catalogue.
            </p>
          </div>
          {hasActiveFilters ? (
            <Link href={actionPath} className="app-button-secondary">
              Réinitialiser les filtres
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
          <label className="rounded-[1.35rem] border border-slate-200/90 bg-white/95 px-4 py-4 shadow-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Recherche
            </span>
            <input
              name="search"
              defaultValue={normalizedValues.search}
              placeholder="Titre, résumé, description, compétences…"
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none"
            />
          </label>

          <label className="rounded-[1.35rem] border border-slate-200/90 bg-white/95 px-4 py-4 shadow-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Compétences
            </span>
            <input
              name="skills"
              defaultValue={normalizedValues.skills}
              placeholder="React, Prisma, UX..."
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectField
            name="type"
            ariaLabel="Type de projet"
            defaultValue={normalizedValues.type}
            options={[
              { value: "", label: "Tous les types" },
              { value: ProjectType.FICTIONAL, label: "Pédagogique" },
              { value: ProjectType.REAL, label: "Entreprise" },
            ]}
          />
          {showLevel ? (
            <SelectField
              name="level"
              ariaLabel="Niveau"
              defaultValue={normalizedValues.level}
              options={[
                { value: "", label: "Tous les niveaux" },
                { value: StudentLevel.LEVEL_1, label: "Niveau 1" },
                { value: StudentLevel.LEVEL_2, label: "Niveau 2" },
                { value: StudentLevel.LEVEL_3, label: "Niveau 3" },
              ]}
            />
          ) : null}
          <SelectField
            name="availability"
            ariaLabel="Disponibilité"
            defaultValue={normalizedValues.availability}
            options={[
              { value: "", label: "Toutes les capacités" },
              { value: "AVAILABLE", label: "Places disponibles" },
              { value: "FULL", label: "Complet" },
            ]}
          />
          <SelectField
            name="applicationStatus"
            ariaLabel="Statut de candidature"
            defaultValue={normalizedValues.applicationStatus}
            options={[
              { value: "", label: "Toutes mes situations" },
              { value: "NOT_APPLIED", label: "Non candidaté" },
              { value: ApplicationStatus.PENDING, label: "En attente" },
              { value: ApplicationStatus.ACCEPTED, label: "Acceptée" },
              { value: ApplicationStatus.REJECTED, label: "Refusée" },
            ]}
          />
          {showStatus ? (
            <SelectField
              name="status"
              ariaLabel="Statut projet"
              defaultValue={values.status ?? ""}
              options={[
                { value: "", label: "Tous les statuts" },
                { value: "DRAFT", label: "Brouillon" },
                { value: "OPEN", label: "Ouvert" },
                { value: "CLOSED", label: "Clos" },
                { value: "IN_PROGRESS", label: "En cours" },
                { value: "COMPLETED", label: "Terminé" },
                { value: "ARCHIVED", label: "Archivé" },
              ]}
            />
          ) : null}
          <SelectField
            name="sort"
            ariaLabel="Tri"
            defaultValue={normalizedValues.sort}
            options={[
              { value: "RECENT", label: "Plus récent" },
              { value: "DEADLINE", label: "Date limite la plus proche" },
              { value: "LEVEL", label: "Niveau" },
              { value: "AVAILABLE_PLACES", label: "Places disponibles" },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="px-5">
            Appliquer les filtres
          </Button>
          <input type="hidden" name="page" value="1" />
        </div>
      </form>

      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2">
          {normalizedValues.search ? <StatusBadge label={`Recherche : ${normalizedValues.search}`} tone="accent" /> : null}
          {normalizedValues.skills ? <StatusBadge label={`Compétences : ${normalizedValues.skills}`} tone="neutral" /> : null}
          {normalizedValues.type ? <StatusBadge label={projectTypeLabels[normalizedValues.type]} tone="info" /> : null}
          {normalizedValues.level ? <StatusBadge label={levelLabels[normalizedValues.level]} tone="accent" /> : null}
          {normalizedValues.availability ? (
            <StatusBadge label={availabilityLabels[normalizedValues.availability]} tone="success" />
          ) : null}
          {normalizedValues.applicationStatus ? (
            <StatusBadge
              label={
                normalizedValues.applicationStatus === "NOT_APPLIED"
                  ? "Non candidaté"
                  : applicationStatusLabels[normalizedValues.applicationStatus]
              }
              tone="warning"
            />
          ) : null}
          {normalizedValues.sort !== "RECENT" ? (
            <StatusBadge label={`Tri : ${sortLabels[normalizedValues.sort]}`} tone="neutral" />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function SelectField({
  name,
  ariaLabel,
  defaultValue,
  options,
}: {
  name: string;
  ariaLabel: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="rounded-[1.25rem] border border-slate-200/90 bg-white/95 px-4 py-3 shadow-sm">
      <span className="sr-only">{ariaLabel}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full border-0 bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
      >
        {options.map((option) => (
          <option key={`${name}-${option.value || "all"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
