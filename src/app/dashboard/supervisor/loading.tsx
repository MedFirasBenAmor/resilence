import { LoadingState } from "@/components/ui/loading-state";

export default function SupervisorDashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <LoadingState label="Chargement du tableau de bord superviseur..." />
    </main>
  );
}
