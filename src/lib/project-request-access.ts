import { CompanyProjectRequestStatus, StudentLevel, UserRole } from "@prisma/client";

export type ProjectRequestActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
  companyId?: string | null;
} | null;

export type ProjectRequestContext = {
  companyId: string;
  status: CompanyProjectRequestStatus;
};

export function canSubmitCompanyProjectRequest(actor: ProjectRequestActor) {
  return Boolean(actor && actor.isActive && actor.role === UserRole.COMPANY && actor.companyId);
}

export function canViewCompanyProjectRequest(
  actor: ProjectRequestActor,
  request: ProjectRequestContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return actor.role === UserRole.COMPANY && actor.companyId === request.companyId;
}

export function canManageCompanyProjectRequests(actor: ProjectRequestActor) {
  return Boolean(actor && actor.isActive && actor.role === UserRole.ADMIN);
}

export function canMoveProjectRequestToStatus(
  currentStatus: CompanyProjectRequestStatus,
  nextStatus: CompanyProjectRequestStatus,
) {
  if (currentStatus === CompanyProjectRequestStatus.CONVERTED) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === CompanyProjectRequestStatus.CONVERTED) {
    return currentStatus === CompanyProjectRequestStatus.APPROVED;
  }

  return true;
}

export function buildProjectRequestConversionDefaults(input: {
  title: string;
  shortSummary: string;
  domain: string;
  desiredLevel: StudentLevel;
  expectedTeamSize: number;
  estimatedDuration: string;
  specBookUrl: string;
}) {
  return {
    title: input.title,
    summary: input.shortSummary,
    description:
      `${input.shortSummary}\n\nDomaine : ${input.domain}\nNiveau cible : ${input.desiredLevel}\nTaille d'équipe souhaitée : ${input.expectedTeamSize}\nDurée estimée : ${input.estimatedDuration}\nCahier des charges MVP : ${input.specBookUrl}`,
    targetLevel: input.desiredLevel,
    capacity: input.expectedTeamSize,
    requiredSkillsInput: input.domain,
  };
}
