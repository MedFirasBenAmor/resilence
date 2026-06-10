import { Prisma } from "@prisma/client";

export function sanitizePortfolioActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Ce slug ou cette ressource existe déjà.";
    }

    if (error.code === "P2003") {
      return "La reference demandee est invalide.";
    }

    return "La base de données a refusé cette opération.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}
