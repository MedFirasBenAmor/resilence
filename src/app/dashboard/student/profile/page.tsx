import Link from "next/link";
import { UserRole } from "@prisma/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StudentProfileForm } from "@/components/student/student-profile-form";
import { LevelBadge } from "@/components/ui/level-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  academicStatusLabels,
  academicStatusTones,
  levelLabels,
  subLevelLabels,
} from "@/lib/ui/status-labels";

export default async function StudentProfilePage() {
  const user = await requireRole(UserRole.STUDENT, "/dashboard/student/profile");
  const student = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      studentProfile: {
        select: {
          displayName: true,
          bio: true,
          cvUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          portfolioUrl: true,
          skills: true,
          level: true,
          subLevel: true,
          availability: true,
          professionalGoal: true,
          academicValidationStatus: true,
          academicValidatedAt: true,
        },
      },
    },
  });

  if (!student?.studentProfile) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 shadow-sm">
          Profil étudiant introuvable. Réessayez plus tard ou contactez l&apos;administration.
        </div>
      </main>
    );
  }

  const displayName =
    student.studentProfile.displayName ??
    `${student.firstName} ${student.lastName}`.trim();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Mon profil"
          title="Identite professionnelle"
          description="Ces informations alimentent vos candidatures, votre progression et votre portfolio public."
          actions={
            <Link href="/dashboard/student/portfolio" className="app-button-primary">
              Voir le portfolio
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.45fr]">
          <div className="space-y-6">
            <section className="app-panel-strong p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-slate-900 text-3xl font-semibold text-white">
                  {displayName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h2>
                    <StatusBadge
                      label={academicStatusLabels[student.studentProfile.academicValidationStatus]}
                      tone={academicStatusTones[student.studentProfile.academicValidationStatus]}
                    />
                  </div>
                  <p className="mt-3 text-base text-slate-600">
                    {student.studentProfile.professionalGoal || "Positionnement professionnel a completer"} •{" "}
                    {levelLabels[student.studentProfile.level]} •{" "}
                    {subLevelLabels[student.studentProfile.subLevel]}
                  </p>
                </div>
              </div>
            </section>

            <section className="app-panel p-7">
              <StudentProfileForm
                initialValues={{
                  displayName,
                  bio: student.studentProfile.bio ?? "",
                  phone: student.phone ?? "",
                  cvUrl: student.studentProfile.cvUrl ?? "",
                  linkedinUrl: student.studentProfile.linkedinUrl ?? "",
                  githubUrl: student.studentProfile.githubUrl ?? "",
                  portfolioUrl: student.studentProfile.portfolioUrl ?? "",
                  skillsInput: student.studentProfile.skills.join("\n"),
                  level: student.studentProfile.level,
                  subLevel: student.studentProfile.subLevel,
                  availability: student.studentProfile.availability ?? "",
                  professionalGoal: student.studentProfile.professionalGoal ?? "",
                }}
              />
            </section>
          </div>

          <aside className="space-y-6">
            <section className="app-panel p-6">
              <h2 className="text-2xl font-semibold text-slate-950">Niveau académique</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.45rem] bg-slate-50/95 px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Niveau
                  </p>
                  <div className="mt-3">
                    <LevelBadge
                      level={student.studentProfile.level}
                      subLevel={student.studentProfile.subLevel}
                    />
                  </div>
                </div>
                <div className="rounded-[1.45rem] bg-slate-50/95 px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Validation
                  </p>
                  <div className="mt-3">
                    <StatusBadge
                      label={academicStatusLabels[student.studentProfile.academicValidationStatus]}
                      tone={academicStatusTones[student.studentProfile.academicValidationStatus]}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="app-panel p-6">
              <p className="app-eyebrow">Confidentialite</p>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Votre e-mail et vos coordonnées ne sont pas visibles publiquement. Ils ne
                servent qu&apos;aux candidatures et aux echanges projet autorises.
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Derniere validation:{" "}
                {student.studentProfile.academicValidatedAt
                  ? new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(student.studentProfile.academicValidatedAt)
                  : "Non renseignee"}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
