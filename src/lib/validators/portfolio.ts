import { z } from "zod";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeBoolean(value: unknown) {
  if (value === true || value === "true" || value === "on") {
    return true;
  }

  return false;
}

export const portfolioSlugSchema = z
  .string()
  .trim()
  .min(3, "Le slug doit contenir au moins 3 caracteres.")
  .max(48, "Le slug ne peut pas depasser 48 caracteres.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Utilisez uniquement des lettres minuscules, chiffres et tirets.",
  );

export const updatePortfolioVisibilitySchema = z
  .object({
    isPortfolioPublic: z.preprocess(normalizeBoolean, z.boolean()),
    portfolioSlug: z.preprocess(normalizeOptionalString, portfolioSlugSchema.optional()),
  })
  .superRefine((value, ctx) => {
    if (value.isPortfolioPublic && !value.portfolioSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["portfolioSlug"],
        message: "Un slug est requis pour activer le portfolio public.",
      });
    }
  });
