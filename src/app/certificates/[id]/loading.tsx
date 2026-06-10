import { LoadingState } from "@/components/ui/loading-state";

export default function CertificateLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <LoadingState label="Chargement de l'attestation" />
    </main>
  );
}
