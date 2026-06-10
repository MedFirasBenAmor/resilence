import {
  DeliverableStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";

export type ProjectRoomActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
  companyId?: string | null;
} | null;

export type ProjectRoomContext = {
  id: string;
  companyId: string | null;
  supervisorUserId: string | null;
  hasActiveMembership: boolean;
};

export function canViewProjectRoom(
  actor: ProjectRoomActor,
  project: ProjectRoomContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  if (
    actor.role === UserRole.SUPERVISOR &&
    project.supervisorUserId === actor.id
  ) {
    return true;
  }

  if (
    actor.role === UserRole.COMPANY &&
    actor.companyId &&
    actor.companyId === project.companyId
  ) {
    return true;
  }

  return actor.role === UserRole.STUDENT && project.hasActiveMembership;
}

export function canManageProjectTasks(
  actor: ProjectRoomActor,
  project: ProjectRoomContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return (
    actor.role === UserRole.SUPERVISOR &&
    project.supervisorUserId === actor.id
  );
}

export function canUpdateProjectTaskStatus(
  actor: ProjectRoomActor,
  project: ProjectRoomContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (canManageProjectTasks(actor, project)) {
    return true;
  }

  return actor.role === UserRole.STUDENT && project.hasActiveMembership;
}

export function canSubmitDeliverable(
  actor: ProjectRoomActor,
  project: ProjectRoomContext,
) {
  return Boolean(
    actor &&
      actor.isActive &&
      actor.role === UserRole.STUDENT &&
      project.hasActiveMembership,
  );
}

export function canReviewDeliverable(
  actor: ProjectRoomActor,
  project: ProjectRoomContext,
) {
  return canManageProjectTasks(actor, project);
}

export function canCommentInProjectRoom(
  actor: ProjectRoomActor,
  project: ProjectRoomContext,
) {
  if (!canViewProjectRoom(actor, project) || !actor) {
    return false;
  }

  if (actor.role === UserRole.COMPANY) {
    return false;
  }

  return true;
}

export function canSetTaskStatus(
  currentStatus: TaskStatus,
  nextStatus: TaskStatus,
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  return true;
}

export function canReviewDeliverableStatus(
  nextStatus: DeliverableStatus,
) {
  const allowedStatuses: DeliverableStatus[] = [
    DeliverableStatus.REVIEWED,
    DeliverableStatus.APPROVED,
    DeliverableStatus.REJECTED,
  ];

  return allowedStatuses.includes(nextStatus);
}
