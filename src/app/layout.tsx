import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resilience Platform",
  description: "Plateforme de professionnalisation des étudiants IT.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
