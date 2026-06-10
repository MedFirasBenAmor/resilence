"use client";

import { useActionState } from "react";
import { createProjectEvaluation } from "@/actions/feedbackActions";
import {
  DEFAULT_FEEDBACK_ACTION_STATE,
  type FeedbackActionState,
} from "@/actions/feedbackActionState";
import {
  MATURITY_SCORE_CRITERIA,
  MATURITY_SCORE_LABELS,
  TECHNICAL_SCORE_CRITERIA,
  TECHNICAL_SCORE_LABELS,
} from "@/lib/scoring";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type EvaluationFormProps = {
  projectId: string;
  membershipId: string;
  studentName: string;
  deliverables: Array<{
    id: string;
    title: string;
    status: string;
  }>;
};

function ScoreField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue="3"
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950"
      >
        <option value="1">1 - Insuffisant</option>
        <option value="2">2 - Faible</option>
        <option value="3">3 - Acceptable</option>
        <option value="4">4 - Bon</option>
        <option value="5">5 - Excellent</option>
      </select>
    </label>
  );
}

export function EvaluationForm({
  projectId,
  membershipId,
  studentName,
  deliverables,
}: EvaluationFormProps) {
  const [state, formAction, pending] = useActionState<FeedbackActionState, FormData>(
    createProjectEvaluation,
    DEFAULT_FEEDBACK_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="membershipId" value={membershipId} />

      <div>
        <h3 className="text-lg font-semibold text-slate-950">Evaluer {studentName}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Les scores vont de 1 a 5. Un commentaire qualitatif est obligatoire.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          htmlFor="feedback-title"
          label="Titre de feedback"
          helperText="Un titre bref qui aide à relire rapidement l'évaluation plus tard."
        >
          <input
            id="feedback-title"
            name="title"
            placeholder="Ex. : bon niveau d'exécution sur le sprint"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>

        <FormField
          htmlFor="feedback-deliverable"
          label="Livrable lie"
          helperText="Optionnel si votre retour concerne tout le projet et pas une livraison precise."
        >
          <select
            id="feedback-deliverable"
            name="deliverableId"
            defaultValue=""
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="">Aucun livrable specifique</option>
            {deliverables.map((deliverable) => (
              <option key={deliverable.id} value={deliverable.id}>
                {deliverable.title} - {deliverable.status}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Score technique
          </h4>
          <div className="grid gap-4">
            {TECHNICAL_SCORE_CRITERIA.map((criterion) => (
              <ScoreField
                key={criterion}
                name={criterion}
                label={TECHNICAL_SCORE_LABELS[criterion]}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Maturité professionnelle
          </h4>
          <div className="grid gap-4">
            {MATURITY_SCORE_CRITERIA.map((criterion) => (
              <ScoreField
                key={criterion}
                name={criterion}
                label={MATURITY_SCORE_LABELS[criterion]}
              />
            ))}
          </div>
        </section>
      </div>

      <FormField
        htmlFor="feedback-comment"
        label="Commentaire qualitatif"
        helperText="Expliquez ce qui est solide, ce qui freine la progression et le prochain cap attendu."
      >
        <textarea
          id="feedback-comment"
          name="comment"
          rows={5}
          placeholder="Expliquez les points forts, les limites observées et les priorités de progression."
          className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
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

      <SubmitButton
        pending={pending}
        idleLabel="Enregistrer l'évaluation"
        pendingLabel="Enregistrement..."
      />
    </form>
  );
}
