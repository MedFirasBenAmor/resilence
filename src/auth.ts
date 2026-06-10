import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { credentialsProvider } from "@/lib/auth/provider";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],
});
