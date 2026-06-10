"use client";

import { useActionState } from "react";
import { updateStudentProfileAction } from "@/actions/studentActions";
import { DEFAULT_STUDENT_ACTION_STATE } from "@/actions/studentActionState";
import type { StudentLevel, StudentSubLevel } from "@prisma/client";
import { FormActions } from "@/components/ui/form-actions";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SubmitButton } from "@/components/ui/submit-button";

type StudentProfileFormProps = {
  initialValues: {
    displayName: string;
    bio: string;
    phone: string;
    cvUrl: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    skillsInput: string;
    level: StudentLevel;
    subLevel: StudentSubLevel;
    availability: string;
    professionalGoal: string;
  };
};

export function StudentProfileForm({ initialValues }: StudentProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateStudentProfileAction,
    DEFAULT_STUDENT_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-6">
      <FormSection
        title="Identite professionnelle"
        description="Soignez d'abord les elements qui vous rendent identifiable et credible dans les dashboards, rooms et candidatures."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            htmlFor="displayName"
            label="Nom affiche"
            helperText="C'est le nom visible sur votre profil et dans les espaces projet."
          >
            <input
              id="displayName"
              name="displayName"
              defaultValue={initialValues.displayName}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
            />
          </FormField>
          <FormField
            htmlFor="phone"
            label="Telephone"
            helperText="Optionnel, utile pour les prises de contact rapides."
          >
            <input
              id="phone"
              name="phone"
              defaultValue={initialValues.phone}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
            />
          </FormField>
        </div>

        <div className="mt-5">
          <FormField
            htmlFor="bio"
            label="Bio"
            helperText="Résumez votre niveau, votre posture de travail et ce que vous savez déjà produire."
          >
            <textarea
              id="bio"
              name="bio"
              defaultValue={initialValues.bio}
              rows={5}
              required
              className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Liens et preuves"
        description="Ajoutez les liens les plus utiles pour une lecture rapide et professionnelle de votre profil."
      >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="cvUrl" label="CV URL" helperText="Lien public vers un CV PDF ou une page CV.">
          <input
            id="cvUrl"
            name="cvUrl"
            type="url"
            defaultValue={initialValues.cvUrl}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="linkedinUrl" label="LinkedIn URL" helperText="Profil public professionnel a jour.">
          <input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            defaultValue={initialValues.linkedinUrl}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="githubUrl" label="GitHub URL" helperText="Depot ou profil principal a mettre en avant.">
          <input
            id="githubUrl"
            name="githubUrl"
            type="url"
            defaultValue={initialValues.githubUrl}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="portfolioUrl" label="URL du portfolio" helperText="Optionnel pour le MVP, utile si vous avez déjà une vitrine.">
          <input
            id="portfolioUrl"
            name="portfolioUrl"
            type="url"
            defaultValue={initialValues.portfolioUrl}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>
      </FormSection>

      <FormSection
        title="Positionnement professionnel"
        description="Clarifiez vos compétences, votre niveau actuel et l'objectif vers lequel vous progressez."
      >
      <FormField
        htmlFor="skillsInput"
        label="Competences"
        helperText="Saisissez une competence par ligne ou separez-les par des virgules."
      >
        <textarea
          id="skillsInput"
          name="skillsInput"
          defaultValue={initialValues.skillsInput}
          rows={4}
          required
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <FormField htmlFor="level" label="Niveau actuel" helperText="Niveau cible actuellement declare sur votre profil.">
          <select
            id="level"
            name="level"
            defaultValue={initialValues.level}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="LEVEL_1">Niveau 1</option>
            <option value="LEVEL_2">Niveau 2</option>
            <option value="LEVEL_3">Niveau 3</option>
          </select>
        </FormField>
        <FormField htmlFor="subLevel" label="Sous-niveau" helperText="Repere plus fin sur votre progression professionnelle.">
          <select
            id="subLevel"
            name="subLevel"
            defaultValue={initialValues.subLevel}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="LEVEL_1_FOUNDATION">Level 1 Foundation</option>
            <option value="LEVEL_1_DELIVERY">Level 1 Delivery</option>
            <option value="LEVEL_1_TRANSITION">Level 1 Transition</option>
            <option value="LEVEL_2_CONTRIBUTOR">Level 2 Contributor</option>
            <option value="LEVEL_2_EXECUTION">Level 2 Execution</option>
            <option value="LEVEL_3_AUTONOMOUS">Level 3 Autonomous</option>
            <option value="LEVEL_3_LEADERSHIP">Level 3 Leadership</option>
          </select>
        </FormField>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <FormField htmlFor="availability" label="Disponibilite" helperText="Ex: 10h/semaine, evenings, full-time stage.">
          <input
            id="availability"
            name="availability"
            defaultValue={initialValues.availability}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor="professionalGoal" label="Objectif professionnel" helperText="Indiquez le poste, la mission ou la posture vers laquelle vous progressez.">
          <input
            id="professionalGoal"
            name="professionalGoal"
            defaultValue={initialValues.professionalGoal}
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
      </div>
      </FormSection>

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

      <FormActions>
        <SubmitButton pending={pending} idleLabel="Enregistrer le profil" pendingLabel="Enregistrement..." />
      </FormActions>
    </form>
  );
}
