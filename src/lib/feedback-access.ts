import { UserRole } from "@prisma/client";

export type FeedbackActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
} | null;

export type FeedbackProjectContext = {
  projectId: string;
  supervisorUserId: string | null;
  membershipIsActive: boolean;
  studentUserId: string;
};

export function canEvaluateProjectMember(
  actor: FeedbackActor,
  context: FeedbackProjectContext,
) {
  if (!actor || !actor.isActive || !context.membershipIsActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return (
    actor.role === UserRole.SUPERVISOR &&
    context.supervisorUserId === actor.id &&
    context.studentUserId !== actor.id
  );
}

export function canViewStudentProgress(
  actor: FeedbackActor,
  studentUserId: string,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return actor.role === UserRole.STUDENT && actor.id === studentUserId;
}

export function canViewFeedback(
  actor: FeedbackActor,
  context: FeedbackProjectContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  if (actor.role === UserRole.STUDENT) {
    return actor.id === context.studentUserId;
  }

  return actor.role === UserRole.SUPERVISOR && context.supervisorUserId === actor.id;
}

export function canAdminListFeedback(actor: FeedbackActor) {
  return Boolean(actor && actor.isActive && actor.role === UserRole.ADMIN);
}

export function canCompanyLeaveFeedback(
  actor: FeedbackActor & { companyId?: string | null },
  context: FeedbackProjectContext & { companyId: string | null },
) {
  return Boolean(
    actor &&
      actor.isActive &&
      actor.role === UserRole.COMPANY &&
      actor.companyId &&
      actor.companyId === context.companyId &&
      context.membershipIsActive,
  );
}
