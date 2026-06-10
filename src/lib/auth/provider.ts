import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/validation";

export const credentialsProvider = CredentialsProvider({
  name: "Email et mot de passe",
  credentials: {
    email: {
      label: "Email",
      type: "email",
    },
    password: {
      label: "Mot de passe",
      type: "password",
    },
  },
  async authorize(credentials) {
    const parsed = loginSchema.safeParse(credentials);

    if (!parsed.success) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash || !user.isActive) {
      return null;
    }

    const isPasswordValid = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
    };
  },
});
