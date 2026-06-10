"use server";

import {
  AcademicValidationStatus,
  NotificationType,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import {
  canManageAcademicValidation,
  canUpdateAcademicValidationForStudent,
  isStudentSubLevelCompatible,
  normalizeSkillsInput,
  studentProfileSchema,
  studentValidationActionSchema,
  summarizeSkills,
} from "@/lib/validators/student";
import type { StudentActionState } from "@/actions/studentActionState";

export async function updateStudentProfileAction(
  _: StudentActionState,
  formData: FormData,
) {
  const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/profile");
  const parsed = studentProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    phone: formData.get("phone"),
    cvUrl: formData.get("cvUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    githubUrl: formData.get("githubUrl"),
    portfolioUrl: formData.get("portfolioUrl"),
    skillsInput: formData.get("skillsInput"),
    level: formData.get("level"),
    subLevel: formData.get("subLevel"),
    availability: formData.get("availability"),
    professionalGoal: formData.get("professionalGoal"),
  });

  if (!parsed.success) {
    return {
      success: null,
      error: parsed.error.issues[0]?.message ?? "Profil invalide.",
    } satisfies StudentActionState;
  }

  if (!isStudentSubLevelCompatible(parsed.data.level, parsed.data.subLevel)) {
    return {
      success: null,
      error: "Le sous-niveau ne correspond pas au niveau sélectionné.",
    } satisfies StudentActionState;
  }

  const skills = normalizeSkillsInput(parsed.data.skillsInput);

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      phone: parsed.data.phone || null,
      studentProfile: {
        update: {
          displayName: parsed.data.displayName,
          bio: parsed.data.bio,
          cvUrl: parsed.data.cvUrl || null,
          linkedinUrl: parsed.data.linkedinUrl || null,
          githubUrl: parsed.data.githubUrl || null,
          portfolioUrl: parsed.data.portfolioUrl || null,
          skills,
          skillsSummary: summarizeSkills(skills),
          level: parsed.data.level,
          subLevel: parsed.data.subLevel,
          availability: parsed.data.availability || null,
          professionalGoal: parsed.data.professionalGoal,
        },
      },
    },
  });

  revalidatePath("/dashboard/student/profile");
  revalidatePath("/dashboard/admin/students");

  return {
    success: "Profil mis à jour.",
    error: null,
  } satisfies StudentActionState;
}

export async function updateAcademicValidationStatusAction(
  _: StudentActionState,
  formData: FormData,
) {
  const actor = await requireAuth("/dashboard/admin/students");

  if (!canManageAcademicValidation(actor)) {
    return {
      success: null,
      error: "Vous n'êtes pas autorisé à modifier ce statut.",
    } satisfies StudentActionState;
  }

  const parsed = studentValidationActionSchema.safeParse({
    studentProfileId: formData.get("studentProfileId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: null,
      error: parsed.error.issues[0]?.message ?? "Action invalide.",
    } satisfies StudentActionState;
  }

  const targetProfile = await prisma.studentProfile.findUnique({
    where: { id: parsed.data.studentProfileId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!targetProfile) {
    return {
      success: null,
      error: "Étudiant introuvable.",
    } satisfies StudentActionState;
  }

  if (!canUpdateAcademicValidationForStudent(actor, targetProfile.userId)) {
    return {
      success: null,
      error: "Vous ne pouvez pas modifier votre propre statut académique.",
    } satisfies StudentActionState;
  }

  const isValidated = parsed.data.status === AcademicValidationStatus.VALIDATED;

  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { id: targetProfile.id },
      data: {
        academicValidationStatus: parsed.data.status,
        academicValidatedById: isValidated ? actor.id : null,
        academicValidatedAt: isValidated ? new Date() : null,
      },
    });

    await createNotification(tx, {
      recipientId: targetProfile.userId,
      type: NotificationType.ACCOUNT_STATUS_CHANGED,
      title:
        parsed.data.status === AcademicValidationStatus.VALIDATED
          ? "Validation académique approuvée"
          : "Statut académique mis à jour",
      message:
        parsed.data.status === AcademicValidationStatus.VALIDATED
          ? "Votre profil académique est validé. Vous pouvez candidater aux projets ouverts."
          : parsed.data.status === AcademicValidationStatus.REJECTED
            ? "Votre validation académique a été rejetée. Consultez votre profil et contactez l’administration si besoin."
            : "Votre statut académique a été mis à jour par l’administration.",
      href: "/dashboard/student/profile",
      metadata: {
        studentProfileId: targetProfile.id,
        status: parsed.data.status,
      },
    });
  });

  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/student/profile");

  return {
    success: "Statut académique mis à jour.",
    error: null,
  } satisfies StudentActionState;
}
