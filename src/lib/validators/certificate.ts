import { z } from "zod";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export const issueCertificateSchema = z.object({
  studentId: z.string().uuid("Etudiant invalide."),
  projectId: z.preprocess(
    normalizeOptionalString,
    z.string().uuid("Projet invalide.").optional(),
  ),
  title: z
    .string()
    .trim()
    .min(6, "Le titre doit contenir au moins 6 caracteres.")
    .max(120, "Le titre ne peut pas depasser 120 caracteres."),
  summary: z.preprocess(
    normalizeOptionalString,
    z
      .string()
      .max(600, "Le résumé ne peut pas dépasser 600 caractères.")
      .optional(),
  ),
});

export const revokeCertificateSchema = z.object({
  certificateId: z.string().uuid("Attestation invalide."),
});
