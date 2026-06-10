"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ZodIssue } from "zod";
import type {
  SupervisorActionState,
  SupervisorFieldErrors,
} from "@/actions/supervisorActionState";
import { createSupervisorAccount } from "@/lib/auth/supervisors";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

function formatSupervisorFieldErrors(issues: ZodIssue[]): SupervisorFieldErrors {
  const fieldErrors: SupervisorFieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as keyof SupervisorFieldErrors] = issue.message;
    }
  }

  return fieldErrors;
}

function formatSupervisorError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Un compte existe deja avec cet email.";
    }

    return "La base de donnees a refuse cette operation.";
  }

  if (error instanceof Error) {
    if (error.message === "EMAIL_ALREADY_EXISTS" || error.message === "UNIQUE_CONSTRAINT_FAILED") {
      return "Un compte existe deja avec cet email.";
    }

    if (error.message === "FORBIDDEN") {
      return "Action reservee aux administrateurs.";
    }
  }

  return "Une erreur inattendue est survenue.";
}

export async function createSupervisorAccountAction(
  _: SupervisorActionState,
  formData: FormData,
): Promise<SupervisorActionState> {
  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/access");

    await createSupervisorAccount(prisma, actor, {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      title: String(formData.get("title") ?? ""),
      department: String(formData.get("department") ?? ""),
      expertiseArea: String(formData.get("expertiseArea") ?? ""),
      organization: String(formData.get("organization") ?? ""),
    });

    revalidatePath("/dashboard/admin/access");
    revalidatePath("/dashboard/admin/audit");
    revalidatePath("/dashboard", "layout");

    return {
      success: "Compte superviseur cree avec succes.",
      error: null,
      fieldErrors: {} as SupervisorFieldErrors,
    };
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      const zodLikeError = error as Error & { issues: ZodIssue[] };

      return {
        success: null,
        error: "Le formulaire contient des erreurs.",
        fieldErrors: formatSupervisorFieldErrors(zodLikeError.issues),
      };
    }

    return {
      success: null,
      error: formatSupervisorError(error),
      fieldErrors: {} as SupervisorFieldErrors,
    };
  }
}
