import { ApplicationStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { applicationStatusLabels, applicationStatusTones } from "@/lib/ui/status-labels";

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
};

export function ApplicationStatusBadge({
  status,
}: ApplicationStatusBadgeProps) {
  return <StatusBadge label={applicationStatusLabels[status]} tone={applicationStatusTones[status]} />;
}
