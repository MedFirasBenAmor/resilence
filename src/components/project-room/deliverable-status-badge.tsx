import { DeliverableStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { deliverableStatusLabels, deliverableStatusTones } from "@/lib/ui/status-labels";

type DeliverableStatusBadgeProps = {
  status: DeliverableStatus;
};

export function DeliverableStatusBadge({
  status,
}: DeliverableStatusBadgeProps) {
  return <StatusBadge label={deliverableStatusLabels[status]} tone={deliverableStatusTones[status]} />;
}
