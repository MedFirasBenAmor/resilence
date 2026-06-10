import {
  ApplicationStatus,
  ProjectStatus,
  ProjectType,
  StudentLevel,
} from "@prisma/client";
import { z } from "zod";
import {
  studentProjectApplicationFilterValues,
  studentProjectAvailabilityValues,
  studentProjectSortValues,
} from "@/lib/project-discovery";

const MAX_PROJECT_SKILL_LENGTH = 60;

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const optionalUuid = z.string().uuid().optional().or(z.literal(""));

export const projectMutationSchema = z
  .object({
    title: z.string().trim().min(4, "Titre trop court.").max(120, "Maximum 120 caracteres."),
    summary: z.string().trim().min(20, "Resume trop court.").max(300, "Maximum 300 caracteres."),
    description: z
      .string()
      .trim()
      .min(40, "Description trop courte.")
      .max(4000, "Maximum 4000 caracteres."),
    type: z.enum(ProjectType),
    status: z.enum(ProjectStatus),
    targetLevel: z.enum(StudentLevel),
    companyId: optionalUuid,
    capacity: z.coerce.number().int().min(1, "Capacite minimale: 1.").max(50, "Capacite maximale: 50."),
    startDate: optionalText,
    endDate: optionalText,
    requiredSkillsInput: z
      .string()
      .trim()
      .max(1000, "Maximum 1000 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((input, ctx) => {
    const skills = normalizeProjectSkills(input.requiredSkillsInput ?? "");

    if (skills.some((skill) => skill.length > MAX_PROJECT_SKILL_LENGTH)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredSkillsInput"],
        message: `Chaque competence doit faire au maximum ${MAX_PROJECT_SKILL_LENGTH} caracteres.`,
      });
    }

    if (input.type === ProjectType.REAL && !input.companyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyId"],
        message: "Une entreprise est requise pour un projet réel.",
      });
    }

    if (input.type === ProjectType.FICTIONAL && input.companyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyId"],
        message: "Un projet fictif ne doit pas être lié à une entreprise.",
      });
    }

    if (input.startDate && Number.isNaN(Date.parse(input.startDate))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Date de debut invalide.",
      });
    }

    if (input.endDate && Number.isNaN(Date.parse(input.endDate))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Date de fin invalide.",
      });
    }

    if (
      input.startDate &&
      input.endDate &&
      !Number.isNaN(Date.parse(input.startDate)) &&
      !Number.isNaN(Date.parse(input.endDate)) &&
      new Date(input.endDate) < new Date(input.startDate)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "La date de fin doit être postérieure à la date de début.",
      });
    }
  });

export const projectApplicationSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  motivation: z
    .string()
    .trim()
    .min(20, "La motivation doit contenir au moins 20 caracteres.")
    .max(1000, "Maximum 1000 caracteres."),
});

export const projectApplicationWithdrawalSchema = z.object({
  applicationId: z.string().uuid("Candidature invalide."),
  projectId: z.string().uuid("Projet invalide."),
});

export const applicationDecisionSchema = z.object({
  applicationId: z.string().uuid("Candidature invalide."),
  status: z.enum([ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]),
});

export const projectFiltersSchema = z.object({
  query: z.string().trim().max(120).optional().or(z.literal("")),
  search: z.string().trim().max(120).optional().or(z.literal("")),
  type: z.enum(ProjectType).optional().or(z.literal("")),
  level: z.enum(StudentLevel).optional().or(z.literal("")),
  status: z.enum(ProjectStatus).optional().or(z.literal("")),
  skills: z.string().trim().max(120).optional().or(z.literal("")),
  availability: z.enum(studentProjectAvailabilityValues).optional().default(""),
  applicationStatus: z.enum(studentProjectApplicationFilterValues).optional().default(""),
  sort: z.enum(studentProjectSortValues).optional().default("RECENT"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const projectIdSchema = z.object({
  id: z.string().uuid("Projet invalide."),
});

export type ProjectMutationInput = z.infer<typeof projectMutationSchema>;
export type ProjectApplicationInput = z.infer<typeof projectApplicationSchema>;
export type ProjectApplicationWithdrawalInput = z.infer<
  typeof projectApplicationWithdrawalSchema
>;
export type ApplicationDecisionInput = z.infer<typeof applicationDecisionSchema>;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;

export function normalizeProjectSkills(raw: string) {
  return [...new Set(
    raw
      .split(/[\n,]/)
      .map((skill) => skill.trim())
      .filter(Boolean),
  )];
}
