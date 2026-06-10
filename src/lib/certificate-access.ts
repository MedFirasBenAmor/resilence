import {
  CertificateStatus,
  UserRole,
} from "@prisma/client";

export type CertificateActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
  companyId?: string | null;
} | null;

export type CertificateIssueContext = {
  membershipExists: boolean;
  supervisorUserId: string | null;
  studentUserId: string;
};

export type CertificateRevokeContext = {
  supervisorUserId: string | null;
  issuedById: string | null;
};

export type CertificateViewContext = {
  status: CertificateStatus;
  studentUserId: string;
  supervisorUserId: string | null;
  issuedById: string | null;
};

export function canIssueCertificate(
  actor: CertificateActor,
  context: CertificateIssueContext,
) {
  if (!actor || !actor.isActive || !context.membershipExists) {
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

export function canRevokeCertificate(
  actor: CertificateActor,
  context: CertificateRevokeContext,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return (
    actor.role === UserRole.SUPERVISOR &&
    (context.supervisorUserId === actor.id || context.issuedById === actor.id)
  );
}

export function canViewCertificate(
  actor: CertificateActor,
  context: CertificateViewContext,
) {
  if (
    context.status === CertificateStatus.ISSUED ||
    context.status === CertificateStatus.REVOKED
  ) {
    return true;
  }

  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  if (actor.role === UserRole.STUDENT) {
    return actor.id === context.studentUserId;
  }

  return (
    actor.role === UserRole.SUPERVISOR &&
    (context.supervisorUserId === actor.id || context.issuedById === actor.id)
  );
}
