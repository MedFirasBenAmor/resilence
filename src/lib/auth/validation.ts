import { UserRole } from "@prisma/client";
import { z } from "zod";
import { isPasswordInputSafe } from "@/lib/auth/password";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Au moins 2 caracteres.")
  .max(80, "Maximum 80 caracteres.");

const passwordSchema = z
  .string()
  .min(8, "Au moins 8 caracteres.")
  .max(72, "Maximum 72 caracteres.")
  .refine(isPasswordInputSafe, "Mot de passe invalide.");

export const loginSchema = z.object({
  email: z.email("Email invalide.").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis."),
});

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z.email("Email invalide.").trim().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmation requise."),
    role: z.literal(UserRole.STUDENT),
  })
  .superRefine((input, ctx) => {
    if (input.password !== input.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas.",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
