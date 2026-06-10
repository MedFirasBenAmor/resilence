"use client";

import { useActionState } from "react";
import { AcademicValidationStatus } from "@prisma/client";
import { updateAcademicValidationStatusAction } from "@/actions/studentActions";
import { DEFAULT_STUDENT_ACTION_STATE } from "@/actions/studentActionState";
import { Button } from "@/components/ui/button";

type StudentValidationActionsProps = {
  studentProfileId: string;
};

export function StudentValidationActions({
  studentProfileId,
}: StudentValidationActionsProps) {
  const [state, formAction, pending] = useActionState(
    updateAcademicValidationStatusAction,
    DEFAULT_STUDENT_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="studentProfileId" value={studentProfileId} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="status"
          value={AcademicValidationStatus.VALIDATED}
          disabled={pending}
          className="px-3 py-2 text-xs"
        >
          Valider
        </Button>
        <Button
          type="submit"
          name="status"
          value={AcademicValidationStatus.REJECTED}
          disabled={pending}
          variant="danger"
          className="px-3 py-2 text-xs"
        >
          Rejeter
        </Button>
        <Button
          type="submit"
          name="status"
          value={AcademicValidationStatus.PENDING}
          disabled={pending}
          variant="secondary"
          className="px-3 py-2 text-xs"
        >
          Remettre en attente
        </Button>
      </div>
      {state.error ? <p className="text-xs text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
    </form>
  );
}
