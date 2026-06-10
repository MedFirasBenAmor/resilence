import {
  AcademicValidationStatus,
  ApplicationStatus,
  ProjectStatus,
  StudentLevel,
  UserRole,
} from "@prisma/client";

export type ProjectActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
  companyId?: string | null;
} | null;

export type ProjectAccessContext = {
  id: string;
  status: ProjectStatus;
  supervisorUserId: string | null;
  companyId: string | null;
};

export type ProjectApplicationPolicyInput = {
  validationStatus: AcademicValidationStatus;
  studentLevel: StudentLevel;
  projectStatus: ProjectStatus;
  projectTargetLevel: StudentLevel;
  existingApplicationStatus: ApplicationStatus | null;
  existingMembership: boolean;
};

export type ProjectPolicyDecision = {
  allowed: boolean;
  reason: string | null;
};

export function canActorAdministerProjects(actor: ProjectActor) {
  return Boolean(actor && actor.isActive && actor.role === UserRole.ADMIN);
}

export function canActorManageProject(
  actor: ProjectActor,
  project: ProjectAccessContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return actor.role === UserRole.SUPERVISOR && project.supervisorUserId === actor.id;
}

export function canActorViewProjectAsCompany(
  actor: ProjectActor,
  project: ProjectAccessContext,
) {
  return Boolean(
    actor &&
      actor.isActive &&
      actor.role === UserRole.COMPANY &&
      actor.companyId &&
      actor.companyId === project.companyId,
  );
}

export function canReviewProjectApplications(
  actor: ProjectActor,
  project: ProjectAccessContext,
) {
  return Boolean(
    canActorAdministerProjects(actor) ||
      (actor &&
        actor.isActive &&
        actor.role === UserRole.SUPERVISOR &&
        project.supervisorUserId === actor.id),
  );
}

export function canStudentSeeAvailableProjects(
  validationStatus: AcademicValidationStatus,
) {
  return validationStatus === AcademicValidationStatus.VALIDATED;
}

export function canApplyToProject(
  input: ProjectApplicationPolicyInput,
): ProjectPolicyDecision {
  if (!canStudentSeeAvailableProjects(input.validationStatus)) {
    return {
      allowed: false,
      reason: "Votre profil académique doit être validé avant de candidater.",
    };
  }

  if (input.existingMembership) {
    return {
      allowed: false,
      reason: "Vous êtes déjà membre de ce projet.",
    };
  }

  if (input.studentLevel !== input.projectTargetLevel) {
    return {
      allowed: false,
      reason: "Ce projet n'est pas compatible avec votre niveau actuel.",
    };
  }

  if (input.existingApplicationStatus) {
    return {
      allowed: false,
      reason: "Vous avez déjà candidaté à ce projet.",
    };
  }

  if (input.projectStatus === ProjectStatus.CLOSED || input.projectStatus === ProjectStatus.ARCHIVED) {
    return {
      allowed: false,
      reason: "Ce projet n'accepte plus de candidatures.",
    };
  }

  if (input.projectStatus !== ProjectStatus.OPEN) {
    return {
      allowed: false,
      reason: "Ce projet n'est pas ouvert aux candidatures.",
    };
  }

  return {
    allowed: true,
    reason: null,
  };
}

export function canWithdrawApplication(
  actorUserId: string,
  applicantUserId: string,
  applicationStatus: ApplicationStatus,
): ProjectPolicyDecision {
  if (actorUserId !== applicantUserId) {
    return {
      allowed: false,
      reason: "Vous ne pouvez retirer que votre propre candidature.",
    };
  }

  if (applicationStatus !== ApplicationStatus.PENDING) {
    return {
      allowed: false,
      reason: "Seule une candidature en attente peut etre retiree.",
    };
  }

  return {
    allowed: true,
    reason: null,
  };
}

export function getApplicationReviewOutcome(status: ApplicationStatus) {
  return {
    createMembership: status === ApplicationStatus.ACCEPTED,
  };
}

export function canTransitionApplicationStatus(
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
  membershipExists: boolean,
  activeMembershipCount?: number,
  capacity?: number | null,
): ProjectPolicyDecision & { createMembership: boolean } {
  if (
    currentStatus !== ApplicationStatus.PENDING &&
    currentStatus !== ApplicationStatus.SHORTLISTED
  ) {
    return {
      allowed: false,
      reason: "Cette candidature ne peut plus etre revue.",
      createMembership: false,
    };
  }

  if (nextStatus === ApplicationStatus.ACCEPTED && membershipExists) {
    return {
      allowed: false,
      reason: "Une affectation existe déjà pour cette candidature.",
      createMembership: false,
    };
  }

  if (
    nextStatus === ApplicationStatus.ACCEPTED &&
    typeof capacity === "number" &&
    capacity > 0 &&
    (activeMembershipCount ?? 0) >= capacity
  ) {
    return {
      allowed: false,
      reason: "La capacité maximale du projet est déjà atteinte.",
      createMembership: false,
    };
  }

  return {
    allowed: true,
    reason: null,
    createMembership: nextStatus === ApplicationStatus.ACCEPTED,
  };
}

export function canStudentViewApplicationStatus(
  actorUserId: string,
  applicantUserId: string,
) {
  return actorUserId === applicantUserId;
}
