import type { DefaultSession, User } from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";
import { DEFAULT_USER_ROLE } from "@/lib/auth/roles";

type AuthorizedUser = User & {
  id: string;
  role: UserRole;
};

type SessionUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
};

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [],
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
        sessionUser.role = (token.role ?? DEFAULT_USER_ROLE) as UserRole;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email ?? "";
      }

      return session;
    },
  },
};
