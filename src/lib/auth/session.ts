import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Session["user"]["role"];
  isActive: boolean;
};

export type AuthenticatedUser = CurrentUser & {
  isActive: true;
};

export function getSessionUserId(session: Session | null) {
  return session?.user?.id ?? null;
}

export async function getCurrentUserBySession(session: Session | null) {
  const userId = getSessionUserId(session);

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  }) satisfies Promise<CurrentUser | null>;
}
