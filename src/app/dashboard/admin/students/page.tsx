import {
  AcademicValidationStatus,
  Prisma,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import { StudentAdminFilters } from "@/components/student/student-admin-filters";
import {
  StudentValidationTable,
  type StudentAdminRow,
} from "@/components/student/student-validation-table";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { studentAdminFiltersSchema } from "@/lib/validators/student";

type AdminStudentsPageProps = {
  searchParams?: Promise<{
    query?: string;
    level?: StudentLevel | "";
    status?: AcademicValidationStatus | "";
  }>;
};

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  await requireRole(UserRole.ADMIN, "/dashboard/admin/students");

  const rawParams = await searchParams;
  const filters = studentAdminFiltersSchema.parse({
    query: rawParams?.query ?? "",
    level: rawParams?.level ?? "",
    status: rawParams?.status ?? "",
  });

  const where: Prisma.StudentProfileWhereInput = {
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.status
      ? { academicValidationStatus: filters.status }
      : {}),
    ...(filters.query
      ? {
          OR: [
            { displayName: { contains: filters.query, mode: "insensitive" } },
            { user: { email: { contains: filters.query, mode: "insensitive" } } },
            { user: { firstName: { contains: filters.query, mode: "insensitive" } } },
            { user: { lastName: { contains: filters.query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const students = await prisma.studentProfile.findMany({
    where,
    orderBy: [{ academicValidationStatus: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      displayName: true,
      level: true,
      academicValidationStatus: true,
      academicValidatedAt: true,
      professionalGoal: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      academicValidatedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const rows: StudentAdminRow[] = students.map((student) => ({
    id: student.id,
    displayName:
      student.displayName ?? `${student.user.firstName} ${student.user.lastName}`.trim(),
    email: student.user.email,
    level: student.level,
    status: student.academicValidationStatus,
    academicValidatedAt: student.academicValidatedAt,
    academicValidatedByName: student.academicValidatedBy
      ? `${student.academicValidatedBy.firstName} ${student.academicValidatedBy.lastName}`.trim()
      : null,
    professionalGoal: student.professionalGoal,
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Validation académique
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Superviser les profils étudiants
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            Filtrez les profils, relisez leur positionnement et mettez a jour le
            statut académique depuis une action strictement vérifiée côté serveur.
          </p>
        </section>

        <StudentAdminFilters
          query={filters.query ?? ""}
          level={filters.level ?? ""}
          status={filters.status ?? ""}
        />

        <StudentValidationTable students={rows} />
      </div>
    </main>
  );
}
