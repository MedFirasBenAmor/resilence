"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import type { AuthActionState } from "@/lib/auth/action-state";
import {
  getDashboardPathForRole,
  resolveSafeInternalRedirect,
} from "@/lib/auth/routing";
import { registerUser } from "@/lib/auth/register";
import { loginSchema, registerSchema } from "@/lib/auth/validation";

export async function loginAction(_: AuthActionState, formData: FormData) {
  const nextField = formData.get("next");
  const nextPath = typeof nextField === "string" ? nextField : null;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Identifiants invalides.",
    } satisfies AuthActionState;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: resolveSafeInternalRedirect(nextPath, "/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Email ou mot de passe incorrect.",
      } satisfies AuthActionState;
    }

    throw error;
  }

  return {
    error: null,
  } satisfies AuthActionState;
}

export async function registerAction(_: AuthActionState, formData: FormData) {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Inscription invalide.",
    } satisfies AuthActionState;
  }

  try {
    const user = await registerUser(parsed.data);

    await signIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirectTo: getDashboardPathForRole(user.role),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "EMAIL_ALREADY_EXISTS" || error.message === "UNIQUE_CONSTRAINT_FAILED")
    ) {
      return {
        error: "Un compte ou une entreprise avec ces informations existe déjà.",
      } satisfies AuthActionState;
    }

    if (error instanceof AuthError) {
      return {
        error: "Le compte a été créé, mais la connexion automatique a échoué.",
      } satisfies AuthActionState;
    }

    throw error;
  }

  return {
    error: null,
  } satisfies AuthActionState;
}
