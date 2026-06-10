import { CertificateStatusBadge } from "@/components/certificates/certificate-status-badge";
import type { CertificateStatus } from "@prisma/client";

type CertificateBadgeProps = {
  status: CertificateStatus;
};

export function CertificateBadge({ status }: CertificateBadgeProps) {
  return <CertificateStatusBadge status={status} />;
}
