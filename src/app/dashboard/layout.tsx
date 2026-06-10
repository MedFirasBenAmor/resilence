import type { ReactNode } from "react";
import { requireAuth } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await requireAuth("/dashboard");
  const unreadNotificationCount = await getUnreadNotificationCountForUser(prisma, user.id);

  return (
    <AppShell
      sidebar={
        <DashboardSidebar
          role={user.role}
          firstName={user.firstName}
          lastName={user.lastName}
        />
      }
      topbar={<DashboardTopbar role={user.role} unreadNotificationCount={unreadNotificationCount} />}
    >
      {children}
    </AppShell>
  );
}
