import type {
  AcademicValidationStatus,
  StudentLevel,
} from "@prisma/client";
import { DataTableLite } from "@/components/ui/data-table-lite";
import { LevelBadge } from "@/components/ui/level-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StudentValidationActions } from "@/components/student/student-validation-actions";
import { academicStatusLabels, academicStatusTones, levelLabels } from "@/lib/ui/status-labels";

export type StudentAdminRow = {
  id: string;
  displayName: string;
  email: string;
  level: StudentLevel;
  status: AcademicValidationStatus;
  academicValidatedAt: Date | null;
  academicValidatedByName: string | null;
  professionalGoal: string | null;
};

type StudentValidationTableProps = {
  students: StudentAdminRow[];
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function StudentValidationTable({
  students,
}: StudentValidationTableProps) {
  if (students.length === 0) {
    return (
      <div className="app-panel-muted p-8 text-sm text-slate-600">
        Aucun étudiant ne correspond aux filtres actuels.
      </div>
    );
  }

  return (
    <DataTableLite
      headers={["Etudiant", "Niveau", "Validation", "Historique", "Actions"]}
      rows={students.map((student) => [
        <div key={`${student.id}-identity`}>
          <p className="font-semibold text-slate-950">{student.displayName}</p>
          <p className="mt-1 text-sm text-slate-600">{student.email}</p>
          {student.professionalGoal ? (
            <p className="mt-2 text-sm text-slate-500">{student.professionalGoal}</p>
          ) : null}
        </div>,
        <div key={`${student.id}-level`}>
          <LevelBadge level={student.level} />
          <p className="mt-2 text-xs text-slate-500">{levelLabels[student.level]}</p>
        </div>,
        <StatusBadge
          key={`${student.id}-status`}
          label={academicStatusLabels[student.status]}
          tone={academicStatusTones[student.status]}
        />,
        <div key={`${student.id}-history`} className="text-sm text-slate-600">
          <p>{formatDate(student.academicValidatedAt)}</p>
          <p className="mt-1">{student.academicValidatedByName ?? "Aucun validateur"}</p>
        </div>,
        <StudentValidationActions key={`${student.id}-actions`} studentProfileId={student.id} />,
      ])}
    />
  );
}
