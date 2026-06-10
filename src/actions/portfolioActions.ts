"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildPublicPortfolioPath,
  canManagePortfolioVisibility,
} from "@/lib/portfolio-access";
import { sanitizePortfolioActionError } from "@/lib/portfolio-errors";
import { requireRole } from "@/lib/rbac";
import { updatePortfolioVisibilitySchema } from "@/lib/validators/portfolio";
import type { PortfolioActionState } from "@/actions/portfolioActionState";

export async function updatePortfolioVisibilityAction(
  _: PortfolioActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/portfolio");
    const parsed = updatePortfolioVisibilitySchema.safeParse({
      isPortfolioPublic: formData.get("isPortfolioPublic"),
      portfolioSlug: formData.get("portfolioSlug"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Configuration du portfolio invalide.",
      } satisfies PortfolioActionState;
    }

    const currentProfile = await prisma.studentProfile.findUnique({
      where: { userId: actor.id },
      select: {
        id: true,
        user: {
          select: {
            id: true,
          },
        },
        portfolioSlug: true,
      },
    });

    if (!currentProfile) {
      return {
        success: null,
        error: "Profil étudiant introuvable.",
      } satisfies PortfolioActionState;
    }

    if (!canManagePortfolioVisibility(actor, currentProfile.user.id)) {
      return {
        success: null,
        error: "Vous ne pouvez pas modifier cette visibilite.",
      } satisfies PortfolioActionState;
    }

    await prisma.studentProfile.update({
      where: { id: currentProfile.id },
      data: {
        isPortfolioPublic: parsed.data.isPortfolioPublic,
        portfolioSlug: parsed.data.portfolioSlug ?? null,
      },
    });

    revalidatePath("/dashboard/student/portfolio");

    if (currentProfile.portfolioSlug) {
      revalidatePath(buildPublicPortfolioPath(currentProfile.portfolioSlug));
    }

    if (parsed.data.portfolioSlug) {
      revalidatePath(buildPublicPortfolioPath(parsed.data.portfolioSlug));
    }

    return {
      success: parsed.data.isPortfolioPublic
        ? "Le portfolio public est actif."
        : "Le portfolio public a ete desactive.",
      error: null,
    } satisfies PortfolioActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizePortfolioActionError(error),
    } satisfies PortfolioActionState;
  }
}
