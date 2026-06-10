import { CompanyProjectRequestStatus } from "@prisma/client";
import type { UiTone } from "@/lib/ui/status-labels";

export const COMPANY_PROJECT_REQUEST_STATUS_LABELS: Record<
  CompanyProjectRequestStatus,
  string
> = {
  SUBMITTED: "Soumise",
  UNDER_REVIEW: "En revue",
  APPROVED: "Approuvee",
  REJECTED: "Rejetee",
  CONVERTED: "Convertie",
};

export const COMPANY_PROJECT_REQUEST_STATUS_TONES: Record<
  CompanyProjectRequestStatus,
  UiTone
> = {
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CONVERTED: "accent",
};
