import { connection } from "next/server";
import { getCertificateById } from "@/actions/certificateActions";
import { BackButton } from "@/components/navigation/back-button";
import { PublicShell } from "@/components/layout/public-shell";
import { CertificatePage } from "@/components/certificates/certificate-page";

export const dynamic = "force-dynamic";

type CertificateDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CertificateDetailPage({
  params,
}: CertificateDetailPageProps) {
  await connection();

  const { id } = await params;
  const certificate = await getCertificateById(id);

  return (
    <PublicShell>
      <div className="space-y-4">
        <BackButton fallbackHref="/dashboard" />
        <CertificatePage certificate={certificate} />
      </div>
    </PublicShell>
  );
}
