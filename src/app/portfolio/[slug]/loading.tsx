import { LoadingState } from "@/components/ui/loading-state";

export default function PublicPortfolioLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <LoadingState label="Chargement du portfolio public" />
    </main>
  );
}
