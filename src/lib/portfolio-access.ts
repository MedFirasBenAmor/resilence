import { UserRole } from "@prisma/client";

export type PortfolioActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
} | null;

export type PublicPortfolioScope = {
  isPortfolioPublic: boolean;
  portfolioSlug: string | null;
};

export function canViewPrivatePortfolio(
  actor: PortfolioActor,
  studentUserId: string,
) {
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  return actor.role === UserRole.STUDENT && actor.id === studentUserId;
}

export function canManagePortfolioVisibility(
  actor: PortfolioActor,
  studentUserId: string,
) {
  return Boolean(
    actor &&
      actor.isActive &&
      actor.role === UserRole.STUDENT &&
      actor.id === studentUserId,
  );
}

export function canViewPublicPortfolio(scope: PublicPortfolioScope) {
  return scope.isPortfolioPublic && Boolean(scope.portfolioSlug);
}

export function buildPublicPortfolioPath(slug: string) {
  return `/portfolio/${slug}`;
}

export function canExposeDetailedPublicFeedback() {
  return false;
}
