import { randomUUID } from "node:crypto";
import {
  AuditAction,
  CertificateStatus,
  NotificationType,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  canIssueCertificate,
  canRevokeCertificate,
  canViewCertificate,
} from "@/lib/certificate-access";
import { sanitizeCertificateActionError } from "@/lib/certificate-errors";
import { getCurrentUser, requireRole } from "@/lib/rbac";
import {
  issueCertificateSchema,
  revokeCertificateSchema,
} from "@/lib/validators/certificate";

export type IssueCertificateInput = {
  studentId: string;
  projectId?: string;
  title: string;
  summary?: string;
};

export type RevokeCertificateInput = {
  certificateId: string;
};

export type CertificateRecordView = {
  id: string;
  title: string;
  status: CertificateStatus;
  referenceCode: string;
  verificationCode: string;
  summary: string | null;
  issuedAt: Date | null;
  studentName: string;
  level: StudentLevel;
  skills: string[];
  projectTitle: string | null;
  supervisorName: string | null;
  membershipPeriod: {
    startedAt: Date | null;
    endedAt: Date | null;
  } | null;
  issuerName: string | null;
};

function createReferenceCode(studentName: string) {
  const normalized = studentName
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("-")
    .toUpperCase();

  return `CERT-${new Date().getUTCFullYear()}-${normalized}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function createVerificationCode() {
  return `VERIFY-${randomUUID().toUpperCase()}`;
}

export async function issueCertificate(input: IssueCertificateInput) {
  "use server";

  try {
    const actor = await requireRole(
      [UserRole.ADMIN, UserRole.SUPERVISOR],
      "/dashboard/student/portfolio",
    );
    const parsed = issueCertificateSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Attestation invalide.");
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: parsed.data.studentId },
      select: {
        id: true,
        level: true,
        skills: true,
        displayName: true,
        portfolioSlug: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Etudiant introuvable.");
    }

    let projectContext:
      | {
          id: string;
          title: string;
          requiredSkills: string[];
          supervisorUserId: string | null;
          membership: {
            id: string;
            startedAt: Date;
            endedAt: Date | null;
          } | null;
          supervisorName: string | null;
        }
      | null = null;

    if (parsed.data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        select: {
          id: true,
          title: true,
          requiredSkills: true,
          supervisor: {
            select: {
              userId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          memberships: {
            where: {
              studentId: student.id,
            },
            select: {
              id: true,
              startedAt: true,
              endedAt: true,
            },
            take: 1,
          },
        },
      });

      if (!project) {
        throw new Error("Projet introuvable.");
      }

      projectContext = {
        id: project.id,
        title: project.title,
        requiredSkills: project.requiredSkills,
        supervisorUserId: project.supervisor?.userId ?? null,
        membership: project.memberships[0] ?? null,
        supervisorName: project.supervisor?.user
          ? `${project.supervisor.user.firstName} ${project.supervisor.user.lastName}`
          : null,
      };
    }

    if (actor.role === UserRole.SUPERVISOR && (!projectContext || !projectContext.membership)) {
      throw new Error("Un superviseur ne peut emettre qu'une attestation liee a son projet.");
    }

    const certificateContext = {
      membershipExists: projectContext ? Boolean(projectContext.membership) : true,
      supervisorUserId: projectContext?.supervisorUserId ?? null,
      studentUserId: student.user.id,
    };

    if (!canIssueCertificate(actor, certificateContext)) {
      throw new Error("Vous ne pouvez pas emettre cette attestation.");
    }

    const studentName =
      student.displayName?.trim() ||
      `${student.user.firstName} ${student.user.lastName}`;
    const supervisorName = projectContext?.supervisorName ?? null;

    const certificate = await prisma.$transaction(async (tx) => {
      const created = await tx.certificate.create({
        data: {
          studentId: student.id,
          projectId: projectContext?.id ?? null,
          membershipId: projectContext?.membership?.id ?? null,
          issuedById: actor.id,
          status: CertificateStatus.ISSUED,
          title: parsed.data.title,
          referenceCode: createReferenceCode(studentName),
          verificationCode: createVerificationCode(),
          summary: parsed.data.summary ?? null,
          studentNameSnapshot: studentName,
          projectTitleSnapshot: projectContext?.title ?? null,
          supervisorNameSnapshot: supervisorName,
          levelSnapshot: student.level,
          skillsSnapshot: projectContext?.requiredSkills.length
            ? projectContext.requiredSkills
            : student.skills,
          issuedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.CERTIFICATE_CREATED,
        targetType: "Certificate",
        targetId: created.id,
        details: {
          studentId: student.id,
          projectId: projectContext?.id ?? null,
          role: actor.role,
        },
      });

      await createNotification(tx, {
        recipientId: student.user.id,
        type: NotificationType.CERTIFICATE_ISSUED,
        title: "Votre attestation est disponible",
        message: `L’attestation ${parsed.data.title} a été émise et peut maintenant être consultée.`,
        href: `/certificates/${created.id}`,
        metadata: {
          certificateId: created.id,
          studentId: student.id,
          projectId: projectContext?.id ?? null,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/student/portfolio");
    revalidatePath(`/certificates/${certificate.id}`);

    if (student.portfolioSlug) {
      revalidatePath(`/portfolio/${student.portfolioSlug}`);
    }

    return certificate;
  } catch (error) {
    throw new Error(sanitizeCertificateActionError(error));
  }
}

export async function revokeCertificate(input: RevokeCertificateInput) {
  "use server";

  try {
    const actor = await requireRole(
      [UserRole.ADMIN, UserRole.SUPERVISOR],
      "/dashboard/student/portfolio",
    );
    const parsed = revokeCertificateSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Attestation invalide.");
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: parsed.data.certificateId },
      select: {
        id: true,
        issuedById: true,
        student: {
          select: {
            portfolioSlug: true,
          },
        },
        project: {
          select: {
            supervisor: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new Error("Attestation introuvable.");
    }

    if (
      !canRevokeCertificate(actor, {
        supervisorUserId: certificate.project?.supervisor?.userId ?? null,
        issuedById: certificate.issuedById,
      })
    ) {
      throw new Error("Vous ne pouvez pas revoquer cette attestation.");
    }

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: CertificateStatus.REVOKED,
      },
    });

    revalidatePath("/dashboard/student/portfolio");
    revalidatePath(`/certificates/${certificate.id}`);

    if (certificate.student.portfolioSlug) {
      revalidatePath(`/portfolio/${certificate.student.portfolioSlug}`);
    }

    return {
      id: certificate.id,
      status: CertificateStatus.REVOKED,
    };
  } catch (error) {
    throw new Error(sanitizeCertificateActionError(error));
  }
}

export async function getCertificateById(
  certificateId: string,
): Promise<CertificateRecordView> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: {
      id: true,
      title: true,
      status: true,
      referenceCode: true,
      verificationCode: true,
      summary: true,
      issuedAt: true,
      studentNameSnapshot: true,
      levelSnapshot: true,
      skillsSnapshot: true,
      projectTitleSnapshot: true,
      supervisorNameSnapshot: true,
      membership: {
        select: {
          startedAt: true,
          endedAt: true,
        },
      },
      issuedById: true,
      issuedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      student: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
      project: {
        select: {
          supervisor: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  const actor = await getCurrentUser();

  if (
    !canViewCertificate(actor, {
      status: certificate.status,
      studentUserId: certificate.student.user.id,
      supervisorUserId: certificate.project?.supervisor?.userId ?? null,
      issuedById: certificate.issuedById,
    })
  ) {
    notFound();
  }

  await createAuditLog(prisma, {
    actorId: actor?.id ?? null,
    action: AuditAction.CERTIFICATE_VERIFIED,
    targetType: "Certificate",
    targetId: certificate.id,
    details: {
      status: certificate.status,
      viewedByRole: actor?.role ?? "PUBLIC",
    },
  });

  return {
    id: certificate.id,
    title: certificate.title,
    status: certificate.status,
    referenceCode: certificate.referenceCode,
    verificationCode: certificate.verificationCode,
    summary: certificate.summary,
    issuedAt: certificate.issuedAt,
    studentName: certificate.studentNameSnapshot,
    level: certificate.levelSnapshot,
    skills: certificate.skillsSnapshot,
    projectTitle: certificate.projectTitleSnapshot,
    supervisorName: certificate.supervisorNameSnapshot,
    membershipPeriod: certificate.membership
      ? {
          startedAt: certificate.membership.startedAt,
          endedAt: certificate.membership.endedAt,
        }
      : null,
    issuerName: certificate.issuedBy
      ? `${certificate.issuedBy.firstName} ${certificate.issuedBy.lastName}`
      : null,
  };
}
