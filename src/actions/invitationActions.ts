"use server";

import { AuditAction, NotificationType, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { signIn } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import {
  acceptRoleInvitation,
  createRoleInvitationRecord,
  createRoleInvitationSchema,
  acceptRoleInvitationSchema,
  expireRoleInvitationRecord,
  revokeRoleInvitationRecord,
} from "@/lib/auth/invitations";
import { resolveSafeInternalRedirect } from "@/lib/auth/routing";
import { createNotification, createNotificationsForAdmins } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type {
  InvitationActionState,
  InvitationLifecycleActionState,
} from "@/actions/invitationActionState";

function formatValidationIssue(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const issue = error.issues[0];

  if (!issue) {
    return "Invitation invalide.";
  }

  if (process.env.NODE_ENV !== "production") {
    const field = issue.path.length ? issue.path.join(".") : "unknown";
    return `${issue.message} [champ: ${field}]`;
  }

  return issue.message;
}

function formatInvitationError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Cette invitation entre en conflit avec des données déjà existantes.";
    }

    return "La base de données a refusé cette opération.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

export async function createRoleInvitationAction(
  _: InvitationActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/access");
    const parsed = createRoleInvitationSchema.safeParse({
      email: formData.get("email"),
      role: formData.get("role"),
      companyName: formData.get("companyName"),
      expiresInDays: formData.get("expiresInDays"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: formatValidationIssue(parsed.error),
        invitePath: null,
      } satisfies InvitationActionState;
    }

    const invitation = await createRoleInvitationRecord(actor.id, parsed.data);

    await createAuditLog(prisma, {
      actorId: actor.id,
      action: AuditAction.ROLE_APPROVED,
      targetType: "RoleInvitation",
      targetId: invitation.id,
      details: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyName,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });

    revalidatePath("/dashboard/admin/access");
    revalidatePath("/dashboard", "layout");

    return {
      success: "Invitation créée avec succès.",
      error: null,
      invitePath: `/register/invite/${invitation.token}`,
    } satisfies InvitationActionState;
  } catch (error) {
    return {
      success: null,
      error: formatInvitationError(error),
      invitePath: null,
    } satisfies InvitationActionState;
  }
}

export async function acceptRoleInvitationAction(
  _: InvitationActionState,
  formData: FormData,
) {
  const nextField = formData.get("next");
  const nextPath = typeof nextField === "string" ? nextField : "/dashboard";

  try {
    const parsed = acceptRoleInvitationSchema.safeParse({
      token: formData.get("token"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: formatValidationIssue(parsed.error),
        invitePath: null,
      } satisfies InvitationActionState;
    }

    const user = await acceptRoleInvitation(parsed.data);

    await prisma.$transaction(async (tx) => {
      await createNotification(tx, {
        recipientId: user.id,
        type: NotificationType.INVITATION_ACCEPTED,
        title: "Invitation acceptée",
        message: "Votre compte a été activé. Vous pouvez maintenant accéder à votre espace Resilience Platform.",
        href: "/dashboard",
        metadata: {
          invitationId: user.invitationId,
          role: user.role,
        },
      });

      await createNotificationsForAdmins(tx, {
        type: NotificationType.INVITATION_ACCEPTED,
        title: "Invitation acceptée",
        message: `${user.firstName} ${user.lastName} a activé son compte ${user.role.toLowerCase()}.`,
        href: "/dashboard/admin/access",
        metadata: {
          invitationId: user.invitationId,
          userId: user.id,
          role: user.role,
        },
      });
    });

    await signIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirectTo: resolveSafeInternalRedirect(nextPath, "/dashboard"),
    });

    return {
      success: "Compte créé avec succès.",
      error: null,
      invitePath: null,
    } satisfies InvitationActionState;
  } catch (error) {
    return {
      success: null,
      error: formatInvitationError(error),
      invitePath: null,
    } satisfies InvitationActionState;
  }
}

async function updateInvitationLifecycle(
  formData: FormData,
  mode: "revoke" | "expire",
) {
  const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/access");
  const invitationId = formData.get("invitationId");

  if (typeof invitationId !== "string" || !invitationId.trim()) {
    return {
      success: null,
      error: "Invitation invalide.",
    } satisfies InvitationLifecycleActionState;
  }

  try {
    const invitation =
      mode === "revoke"
        ? await revokeRoleInvitationRecord(invitationId)
        : await expireRoleInvitationRecord(invitationId);

    await createAuditLog(prisma, {
      actorId: actor.id,
      action:
        mode === "revoke"
          ? AuditAction.INVITATION_REVOKED
          : AuditAction.INVITATION_EXPIRED,
      targetType: "RoleInvitation",
      targetId: invitation.id,
      details: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyName,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });

    revalidatePath("/dashboard/admin/access");
    revalidatePath("/dashboard/admin/audit");
    revalidatePath("/dashboard", "layout");

    return {
      success: mode === "revoke" ? "Invitation révoquée." : "Invitation expirée.",
      error: null,
    } satisfies InvitationLifecycleActionState;
  } catch (error) {
    return {
      success: null,
      error: formatInvitationError(error),
    } satisfies InvitationLifecycleActionState;
  }
}

export async function revokeRoleInvitationAction(
  _: InvitationLifecycleActionState,
  formData: FormData,
) {
  return updateInvitationLifecycle(formData, "revoke");
}

export async function expireRoleInvitationAction(
  _: InvitationLifecycleActionState,
  formData: FormData,
) {
  return updateInvitationLifecycle(formData, "expire");
}
