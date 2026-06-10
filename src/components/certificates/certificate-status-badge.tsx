import { type CertificateStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  certificateStatusLabels,
  certificateStatusTones,
} from "@/lib/ui/status-labels";

type CertificateStatusBadgeProps = {
  status: CertificateStatus;
};

export function CertificateStatusBadge({
  status,
}: CertificateStatusBadgeProps) {
  return (
    <StatusBadge
      label={certificateStatusLabels[status]}
      tone={certificateStatusTones[status]}
    />
  );
}
