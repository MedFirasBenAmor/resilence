import type { DefaultSession, User } from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/validation";

type AuthorizedUser = User & {
  id: string;
  role: UserRole;
};

type SessionUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
};

export const authOptions: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
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
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authorizedUser = user as AuthorizedUser;
        token.sub = user.id;
        token.role = authorizedUser.role;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const sessionUser = session.user as SessionUser;

        sessionUser.id = token.sub;
        sessionUser.role = (token.role ?? UserRole.STUDENT) as UserRole;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email ?? "";
      }

      return session;
    },
  },
};
