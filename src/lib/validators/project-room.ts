import { DeliverableStatus, TaskStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = z.string().trim().max(2000, "Valeur trop longue.").optional().or(z.literal(""));
const optionalUrl = z.url("URL invalide.").trim().optional().or(z.literal(""));

export const projectRoomIdSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
});

export const projectTaskMutationSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  taskId: z.string().uuid("Tache invalide.").optional().or(z.literal("")),
  title: z.string().trim().min(4, "Titre trop court.").max(120, "Maximum 120 caracteres."),
  description: optionalText,
  dueDate: optionalText,
  status: z.enum(TaskStatus),
}).superRefine((input, ctx) => {
  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message: "Deadline invalide.",
    });
  }
});

export const projectTaskStatusSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  taskId: z.string().uuid("Tache invalide."),
  status: z.enum(TaskStatus),
});

export const deliverableSubmitSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  taskId: z.string().uuid("Tache invalide.").optional().or(z.literal("")),
  title: z.string().trim().min(4, "Titre trop court.").max(120, "Maximum 120 caracteres."),
  description: optionalText,
  submissionUrl: z.url("URL de livrable invalide.").trim(),
  repositoryUrl: optionalUrl,
});

export const deliverableReviewSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  deliverableId: z.string().uuid("Livrable invalide."),
  status: z.enum([
    DeliverableStatus.REVIEWED,
    DeliverableStatus.APPROVED,
    DeliverableStatus.REJECTED,
  ]),
  reviewComment: optionalText,
});

export const projectCommentSchema = z.object({
  projectId: z.string().uuid("Projet invalide."),
  deliverableId: z.string().uuid("Livrable invalide.").optional().or(z.literal("")),
  body: z.string().trim().min(2, "Commentaire vide.").max(1000, "Maximum 1000 caracteres."),
});

export type ProjectTaskMutationInput = z.infer<typeof projectTaskMutationSchema>;
export type ProjectTaskStatusInput = z.infer<typeof projectTaskStatusSchema>;
export type DeliverableSubmitInput = z.infer<typeof deliverableSubmitSchema>;
export type DeliverableReviewInput = z.infer<typeof deliverableReviewSchema>;
export type ProjectCommentInput = z.infer<typeof projectCommentSchema>;

export function toOptionalDate(value: string | undefined) {
  return value ? new Date(value) : null;
}
