import { Prisma } from "@prisma/client";

export function sanitizeFeedbackActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Cette évaluation entre en conflit avec des données déjà existantes.";
    }

    if (error.code === "P2003") {
      return "La relation demandee est invalide.";
    }

    return "La base de données a refusé cette opération.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}
