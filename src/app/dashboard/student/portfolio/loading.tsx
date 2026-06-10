import { LoadingState } from "@/components/ui/loading-state";

export default function StudentPortfolioLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <LoadingState label="Chargement du portfolio et des attestations" />
    </main>
  );
}
