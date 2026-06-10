"use client";

import { useActionState } from "react";
import { createCompanyFeedbackAction } from "@/actions/feedbackActions";
import { DEFAULT_FEEDBACK_ACTION_STATE } from "@/actions/feedbackActionState";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type CompanyFeedbackFormProps = {
  projectId: string;
  membershipId: string;
};

export function CompanyFeedbackForm({
  projectId,
  membershipId,
}: CompanyFeedbackFormProps) {
  const [state, formAction, pending] = useActionState(
    createCompanyFeedbackAction,
    DEFAULT_FEEDBACK_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="membershipId" value={membershipId} />

      <FormField htmlFor={`company-feedback-title-${membershipId}`} label="Titre">
        <input
          id={`company-feedback-title-${membershipId}`}
          name="title"
          placeholder="Ex: Bon niveau de communication client"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <FormField htmlFor={`company-feedback-comment-${membershipId}`} label="Commentaire">
          <textarea
            id={`company-feedback-comment-${membershipId}`}
            name="comment"
            rows={4}
            placeholder="Retour entreprise sur la collaboration, la clarte, la fiabilite ou la livraison."
            className="w-full rounded-[24px] border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
          />
        </FormField>
        <FormField htmlFor={`company-feedback-rating-${membershipId}`} label="Score">
          <select
            id={`company-feedback-rating-${membershipId}`}
            name="rating"
            defaultValue="4"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 shadow-sm transition focus:border-sky-400"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </FormField>
      </div>

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

      <SubmitButton pending={pending} idleLabel="Envoyer le feedback" pendingLabel="Envoi..." />
    </form>
  );
}
