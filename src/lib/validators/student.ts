import {
  AcademicValidationStatus,
  StudentLevel,
  StudentSubLevel,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

const MAX_SKILL_LENGTH = 60;

const optionalTrimmedString = z
  .string()
  .trim()
  .max(500, "Valeur trop longue.")
  .optional()
  .or(z.literal(""));

const optionalUrl = z
  .url("URL invalide.")
  .trim()
  .optional()
  .or(z.literal(""));

function isAllowedHost(url: string, allowedHosts: string[]) {
  const hostname = new URL(url).hostname.toLowerCase();

  return allowedHosts.some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
  );
}

const optionalGithubUrl = optionalUrl.refine(
  (value) => !value || isAllowedHost(value, ["github.com", "github.demo.local"]),
  "URL GitHub invalide.",
);

const optionalLinkedinUrl = optionalUrl.refine(
  (value) => !value || isAllowedHost(value, ["linkedin.com", "linkedin.demo.local"]),
  "URL LinkedIn invalide.",
);

const phoneSchema = z
  .string()
  .trim()
  .max(30, "Telephone trop long.")
  .optional()
  .or(z.literal(""));

export const studentProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Le nom affiche est requis.")
    .max(80, "Maximum 80 caracteres."),
  bio: z
    .string()
    .trim()
    .min(20, "La bio doit contenir au moins 20 caracteres.")
    .max(1000, "Maximum 1000 caracteres."),
  phone: phoneSchema,
  cvUrl: optionalUrl,
  linkedinUrl: optionalLinkedinUrl,
  githubUrl: optionalGithubUrl,
  portfolioUrl: optionalUrl,
  skillsInput: z
    .string()
    .trim()
    .min(2, "Ajoutez au moins une competence.")
    .max(1000, "Maximum 1000 caracteres.")
    .refine((value) => normalizeSkillsInput(value).length > 0, "Ajoutez au moins une competence.")
    .refine(
      (value) => normalizeSkillsInput(value).every((skill) => skill.length <= MAX_SKILL_LENGTH),
      `Chaque competence doit faire au maximum ${MAX_SKILL_LENGTH} caracteres.`,
    ),
  level: z.enum(StudentLevel),
  subLevel: z.enum(StudentSubLevel),
  availability: optionalTrimmedString,
  professionalGoal: z
    .string()
    .trim()
    .min(10, "L'objectif professionnel doit contenir au moins 10 caracteres.")
    .max(300, "Maximum 300 caracteres."),
});

export const studentValidationActionSchema = z.object({
  studentProfileId: z.string().uuid("Profil étudiant invalide."),
  status: z.enum(AcademicValidationStatus),
});

export const studentAdminFiltersSchema = z.object({
  query: z.string().trim().max(120).optional().or(z.literal("")),
  level: z.enum(StudentLevel).optional().or(z.literal("")),
  status: z.enum(AcademicValidationStatus).optional().or(z.literal("")),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type StudentValidationActionInput = z.infer<typeof studentValidationActionSchema>;
export type StudentAdminFiltersInput = z.infer<typeof studentAdminFiltersSchema>;

export function normalizeSkillsInput(skillsInput: string) {
  return [...new Set(
    skillsInput
      .split(/[\n,]/)
      .map((skill) => skill.trim())
      .filter(Boolean),
  )];
}

export function summarizeSkills(skills: string[]) {
  return skills.join(", ");
}

export function isStudentSubLevelCompatible(
  level: StudentLevel,
  subLevel: StudentSubLevel,
) {
  if (level === StudentLevel.LEVEL_1) {
    const allowed: StudentSubLevel[] = [
      StudentSubLevel.LEVEL_1_FOUNDATION,
      StudentSubLevel.LEVEL_1_DELIVERY,
      StudentSubLevel.LEVEL_1_TRANSITION,
    ];

    return allowed.includes(subLevel);
  }

  if (level === StudentLevel.LEVEL_2) {
    const allowed: StudentSubLevel[] = [
      StudentSubLevel.LEVEL_2_CONTRIBUTOR,
      StudentSubLevel.LEVEL_2_EXECUTION,
    ];

    return allowed.includes(subLevel);
  }

  const allowed: StudentSubLevel[] = [
    StudentSubLevel.LEVEL_3_AUTONOMOUS,
    StudentSubLevel.LEVEL_3_LEADERSHIP,
  ];

  return allowed.includes(subLevel);
}

export function canManageAcademicValidation(actor: {
  id: string;
  role: UserRole;
  isActive: boolean;
} | null) {
  return Boolean(
    actor &&
      actor.isActive &&
      actor.role === UserRole.ADMIN,
  );
}

export function canUpdateAcademicValidationForStudent(
  actor: {
    id: string;
    role: UserRole;
    isActive: boolean;
  } | null,
  targetUserId: string,
) {
  if (!canManageAcademicValidation(actor)) {
    return false;
  }

  return actor !== null && actor.id !== targetUserId;
}
