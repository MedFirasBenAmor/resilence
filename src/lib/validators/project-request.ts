import { CompanyProjectRequestStatus, StudentLevel } from "@prisma/client";
import { z } from "zod";

const requestStatusValues = Object.values(CompanyProjectRequestStatus) as [
  CompanyProjectRequestStatus,
  ...CompanyProjectRequestStatus[],
];

export const companyProjectRequestSchema = z.object({
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caracteres.").max(160, "Maximum 160 caracteres."),
  shortSummary: z.string().trim().min(20, "Le résumé doit contenir au moins 20 caractères.").max(300, "Maximum 300 caractères."),
  domain: z.string().trim().min(2, "Le domaine est requis.").max(120, "Maximum 120 caracteres."),
  desiredLevel: z.nativeEnum(StudentLevel, {
    error: "Le niveau cible est requis.",
  }),
  expectedTeamSize: z.coerce.number().int().min(1, "Minimum 1 personne.").max(20, "Maximum 20 personnes."),
  estimatedDuration: z.string().trim().min(2, "La duree estimee est requise.").max(120, "Maximum 120 caracteres."),
  specBookUrl: z.url("Le cahier des charges MVP doit être une URL valide vers un PDF ou un document accessible."),
});

export const companyProjectRequestIdSchema = z.object({
  id: z.uuid("Demande invalide."),
});

export const companyProjectRequestReviewSchema = z.object({
  requestId: z.uuid("Demande invalide."),
  note: z.string().trim().max(2000, "Maximum 2000 caracteres.").optional().or(z.literal("")),
});

export const companyProjectRequestStatusSchema = z.object({
  requestId: z.uuid("Demande invalide."),
  status: z.enum(requestStatusValues),
  note: z.string().trim().max(2000, "Maximum 2000 caracteres.").optional().or(z.literal("")),
});

export const convertProjectRequestSchema = z.object({
  requestId: z.uuid("Demande invalide."),
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caracteres.").max(160, "Maximum 160 caracteres."),
  summary: z.string().trim().min(20, "Le résumé doit contenir au moins 20 caractères.").max(300, "Maximum 300 caractères."),
  description: z.string().trim().min(40, "La description doit contenir au moins 40 caracteres.").max(6000, "Maximum 6000 caracteres."),
  targetLevel: z.nativeEnum(StudentLevel),
  capacity: z.coerce.number().int().min(1, "Minimum 1 personne.").max(50, "Maximum 50 personnes."),
  requiredSkillsInput: z.string().trim().max(2000, "Maximum 2000 caracteres.").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CompanyProjectRequestInput = z.infer<typeof companyProjectRequestSchema>;
