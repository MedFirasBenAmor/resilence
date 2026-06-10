import { FeedbackSource } from "@prisma/client";
import { z } from "zod";
import {
  MATURITY_SCORE_CRITERIA,
  TECHNICAL_SCORE_CRITERIA,
  requireCommentForLowScore,
  validateScoreRange,
  type MaturityScoreCriterion,
  type TechnicalScoreCriterion,
} from "@/lib/scoring";

const optionalText = z.string().trim().max(2000, "Valeur trop longue.").optional().or(z.literal(""));
const optionalUuid = z.string().uuid("Reference invalide.").optional().or(z.literal(""));
const scoreValueSchema = z.coerce.number().int("Score invalide.").refine(validateScoreRange, "Le score doit etre compris entre 1 et 5.");

const technicalScoreFields = {
  code_quality: scoreValueSchema,
  problem_solving: scoreValueSchema,
  technical_autonomy: scoreValueSchema,
  documentation: scoreValueSchema,
  delivery_quality: scoreValueSchema,
} satisfies Record<TechnicalScoreCriterion, typeof scoreValueSchema>;

const maturityScoreFields = {
  communication: scoreValueSchema,
  reliability: scoreValueSchema,
  teamwork: scoreValueSchema,
  deadline_respect: scoreValueSchema,
  initiative: scoreValueSchema,
} satisfies Record<MaturityScoreCriterion, typeof scoreValueSchema>;

export const technicalScoresSchema = z.object(technicalScoreFields);
export const maturityScoresSchema = z.object(maturityScoreFields);

export const projectEvaluationSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  membershipId: z.string().uuid("Membership invalide."),
  deliverableId: optionalUuid.transform((value) => value ?? ""),
  title: z.string().trim().min(4, "Titre trop court.").max(120, "Maximum 120 caracteres.").optional().or(z.literal("")).transform((value) => value ?? ""),
  comment: z.string().trim().min(10, "Le commentaire qualitatif est obligatoire.").max(2000, "Valeur trop longue."),
  source: z.enum([FeedbackSource.SUPERVISOR, FeedbackSource.ADMIN]).optional(),
  technicalScores: technicalScoresSchema,
  maturityScores: maturityScoresSchema,
}).superRefine((input, ctx) => {
  const scoreValues = [
    ...Object.values(input.technicalScores),
    ...Object.values(input.maturityScores),
  ];

  if (!requireCommentForLowScore(scoreValues, input.comment ?? "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["comment"],
      message: "Un commentaire qualitatif est obligatoire si un score est inferieur ou egal a 2.",
    });
  }
});

export const projectEvaluationFormSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  membershipId: z.string().uuid("Membership invalide."),
  deliverableId: optionalUuid,
  title: optionalText,
  comment: z.string().trim().min(10, "Le commentaire qualitatif est obligatoire.").max(2000, "Valeur trop longue."),
  code_quality: scoreValueSchema,
  problem_solving: scoreValueSchema,
  technical_autonomy: scoreValueSchema,
  documentation: scoreValueSchema,
  delivery_quality: scoreValueSchema,
  communication: scoreValueSchema,
  reliability: scoreValueSchema,
  teamwork: scoreValueSchema,
  deadline_respect: scoreValueSchema,
  initiative: scoreValueSchema,
}).superRefine((input, ctx) => {
  const scoreValues = [
    input.code_quality,
    input.problem_solving,
    input.technical_autonomy,
    input.documentation,
    input.delivery_quality,
    input.communication,
    input.reliability,
    input.teamwork,
    input.deadline_respect,
    input.initiative,
  ];

  if (!requireCommentForLowScore(scoreValues, input.comment)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["comment"],
      message: "Un commentaire qualitatif est obligatoire si un score est inferieur ou egal a 2.",
    });
  }
}).transform((input) => ({
  projectId: input.projectId,
  membershipId: input.membershipId,
  deliverableId: input.deliverableId ?? "",
  title: input.title ?? "",
  comment: input.comment,
  technicalScores: {
    code_quality: input.code_quality,
    problem_solving: input.problem_solving,
    technical_autonomy: input.technical_autonomy,
    documentation: input.documentation,
    delivery_quality: input.delivery_quality,
  },
  maturityScores: {
    communication: input.communication,
    reliability: input.reliability,
    teamwork: input.teamwork,
    deadline_respect: input.deadline_respect,
    initiative: input.initiative,
  },
}));

export const adminFeedbackFiltersSchema = z.object({
  projectId: optionalUuid,
  studentId: optionalUuid,
  evaluatorId: optionalUuid,
  query: z.string().trim().max(120, "Recherche trop longue.").optional().or(z.literal("")),
  lowScoreOnly: z.enum(["true", "false"]).optional().or(z.literal("false")),
  dateFrom: z.string().trim().optional().or(z.literal("")),
  dateTo: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
}).superRefine((input, ctx) => {
  if (input.dateFrom && Number.isNaN(Date.parse(input.dateFrom))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateFrom"],
      message: "Date de debut invalide.",
    });
  }

  if (input.dateTo && Number.isNaN(Date.parse(input.dateTo))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateTo"],
      message: "Date de fin invalide.",
    });
  }
});

export const companyFeedbackSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  membershipId: z.string().uuid("Membership invalide."),
  title: optionalText,
  comment: z.string().trim().min(10, "Le commentaire qualitatif est obligatoire.").max(2000, "Valeur trop longue."),
  rating: z.coerce.number().int("Score invalide.").refine(validateScoreRange, "Le score doit etre compris entre 1 et 5."),
});

export function getTechnicalScoreEntries(
  scores: z.infer<typeof technicalScoresSchema>,
) {
  return TECHNICAL_SCORE_CRITERIA.map((criterion) => ({
    criterion,
    score: scores[criterion],
  }));
}

export function getMaturityScoreEntries(
  scores: z.infer<typeof maturityScoresSchema>,
) {
  return MATURITY_SCORE_CRITERIA.map((criterion) => ({
    criterion,
    score: scores[criterion],
  }));
}
