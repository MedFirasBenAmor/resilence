import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/rbac";
import { getDashboardPathForRole } from "@/lib/auth/routing";

export default async function DashboardPage() {
  const user = await requireAuth("/dashboard");

  redirect(getDashboardPathForRole(user.role));
}
