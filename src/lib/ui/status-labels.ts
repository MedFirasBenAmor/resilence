import {
  AcademicValidationStatus,
  ApplicationStatus,
  CertificateStatus,
  DeliverableStatus,
  ProjectStatus,
  ProjectType,
  StudentLevel,
  StudentSubLevel,
  TaskStatus,
} from "@prisma/client";

export type UiTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export const projectStatusLabels: Record<ProjectStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert",
  CLOSED: "Clos",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
};

export const projectStatusTones: Record<ProjectStatus, UiTone> = {
  DRAFT: "neutral",
  OPEN: "info",
  CLOSED: "warning",
  IN_PROGRESS: "accent",
  COMPLETED: "success",
  ARCHIVED: "neutral",
};

export const projectTypeLabels: Record<ProjectType, string> = {
  FICTIONAL: "Pédagogique",
  REAL: "Projet réel",
};

export const academicStatusLabels: Record<AcademicValidationStatus, string> = {
  PENDING: "En attente",
  IN_REVIEW: "En revue",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
};

export const academicStatusTones: Record<AcademicValidationStatus, UiTone> = {
  PENDING: "warning",
  IN_REVIEW: "info",
  VALIDATED: "success",
  REJECTED: "danger",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING: "En attente",
  SHORTLISTED: "Présélection",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
};

export const applicationStatusTones: Record<ApplicationStatus, UiTone> = {
  PENDING: "warning",
  SHORTLISTED: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  BLOCKED: "Bloquée",
};

export const taskStatusTones: Record<TaskStatus, UiTone> = {
  TODO: "neutral",
  IN_PROGRESS: "info",
  DONE: "success",
  BLOCKED: "danger",
};

export const deliverableStatusLabels: Record<DeliverableStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumis",
  IN_REVIEW: "En revue",
  REVIEWED: "Relu",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
};

export const deliverableStatusTones: Record<DeliverableStatus, UiTone> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  IN_REVIEW: "info",
  REVIEWED: "accent",
  APPROVED: "success",
  REJECTED: "danger",
};

export const certificateStatusLabels: Record<CertificateStatus, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Valide",
  REVOKED: "Révoquée",
  EXPIRED: "Expirée",
};

export const certificateStatusTones: Record<CertificateStatus, UiTone> = {
  DRAFT: "neutral",
  ISSUED: "success",
  REVOKED: "danger",
  EXPIRED: "warning",
};

export const levelLabels: Record<StudentLevel, string> = {
  LEVEL_1: "Niveau 1",
  LEVEL_2: "Niveau 2",
  LEVEL_3: "Niveau 3",
};

export const subLevelLabels: Record<StudentSubLevel, string> = {
  LEVEL_1_FOUNDATION: "Fondation",
  LEVEL_1_DELIVERY: "Delivery",
  LEVEL_1_TRANSITION: "Transition",
  LEVEL_2_CONTRIBUTOR: "Contributor",
  LEVEL_2_EXECUTION: "Exécution",
  LEVEL_3_AUTONOMOUS: "Autonome",
  LEVEL_3_LEADERSHIP: "Leadership",
};
