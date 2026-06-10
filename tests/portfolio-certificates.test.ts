import test from "node:test";
import assert from "node:assert/strict";
import {
  Prisma,
  UserRole,
  CertificateStatus,
} from "@prisma/client";
import {
  buildPublicPortfolioPath,
  canExposeDetailedPublicFeedback,
  canManagePortfolioVisibility,
  canViewPrivatePortfolio,
  canViewPublicPortfolio,
} from "@/lib/portfolio-access";
import {
  canIssueCertificate,
  canRevokeCertificate,
  canViewCertificate,
} from "@/lib/certificate-access";
import { sanitizePortfolioActionError } from "@/lib/portfolio-errors";
import { sanitizeCertificateActionError } from "@/lib/certificate-errors";
import {
  portfolioSlugSchema,
  updatePortfolioVisibilitySchema,
} from "@/lib/validators/portfolio";
import { issueCertificateSchema } from "@/lib/validators/certificate";
import { calculateGlobalScore } from "@/lib/scoring";
import { certificateStatusLabels } from "@/lib/ui/status-labels";

test("etudiant voit son portfolio prive", () => {
  assert.equal(
    canViewPrivatePortfolio(
      {
        id: "student-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      "student-1",
    ),
    true,
  );
});

test("etudiant ne voit pas le portfolio prive d'un autre etudiant", () => {
  assert.equal(
    canViewPrivatePortfolio(
      {
        id: "student-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      "student-2",
    ),
    false,
  );
});

test("portfolio public desactive est inaccessible publiquement", () => {
  assert.equal(
    canViewPublicPortfolio({
      isPortfolioPublic: false,
      portfolioSlug: "rayan-haddad",
    }),
    false,
  );
});

test("portfolio public active est accessible via slug", () => {
  assert.equal(
    canViewPublicPortfolio({
      isPortfolioPublic: true,
      portfolioSlug: "rayan-haddad",
    }),
    true,
  );
  assert.equal(buildPublicPortfolioPath("rayan-haddad"), "/portfolio/rayan-haddad");
});

test("slug invalide refuse", () => {
  assert.equal(portfolioSlugSchema.safeParse("Bad Slug").success, false);
});

test("slug duplique remonte une erreur sure", () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    {
      code: "P2002",
      clientVersion: "test",
    },
  );

  assert.equal(
    sanitizePortfolioActionError(duplicate),
    "Ce slug ou cette ressource existe déjà.",
  );
});

test("donnees privees non exposees dans le portfolio public", () => {
  assert.equal(canExposeDetailedPublicFeedback(), false);
});

test("scores portfolio restent coherents avec le helper scoring", () => {
  assert.equal(calculateGlobalScore(4.2, 4.1), 4.15);
});

test("admin peut emettre une attestation", () => {
  assert.equal(
    canIssueCertificate(
      {
        id: "admin-1",
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        membershipExists: true,
        supervisorUserId: "supervisor-1",
        studentUserId: "student-1",
      },
    ),
    true,
  );
});

test("superviseur peut emettre une attestation pour son projet", () => {
  assert.equal(
    canIssueCertificate(
      {
        id: "supervisor-1",
        role: UserRole.SUPERVISOR,
        isActive: true,
      },
      {
        membershipExists: true,
        supervisorUserId: "supervisor-1",
        studentUserId: "student-1",
      },
    ),
    true,
  );
});

test("superviseur ne peut pas emettre une attestation pour un projet non supervise", () => {
  assert.equal(
    canIssueCertificate(
      {
        id: "supervisor-2",
        role: UserRole.SUPERVISOR,
        isActive: true,
      },
      {
        membershipExists: true,
        supervisorUserId: "supervisor-1",
        studentUserId: "student-1",
      },
    ),
    false,
  );
});

test("student ne peut pas emettre une attestation", () => {
  assert.equal(
    canIssueCertificate(
      {
        id: "student-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        membershipExists: true,
        supervisorUserId: "supervisor-1",
        studentUserId: "student-1",
      },
    ),
    false,
  );
});

test("company ne peut pas emettre une attestation", () => {
  assert.equal(
    canIssueCertificate(
      {
        id: "company-1",
        role: UserRole.COMPANY,
        isActive: true,
      },
      {
        membershipExists: true,
        supervisorUserId: "supervisor-1",
        studentUserId: "student-1",
      },
    ),
    false,
  );
});

test("attestation liee a un projet refuse un etudiant non membre", () => {
  assert.equal(
    canIssueCertificate(
      {
        id: "admin-1",
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        membershipExists: false,
        supervisorUserId: "supervisor-1",
        studentUserId: "student-1",
      },
    ),
    false,
  );
});

test("attestation ISSUED est affichee comme valide", () => {
  assert.equal(certificateStatusLabels[CertificateStatus.ISSUED], "Valide");
});

test("attestation REVOKED est affichee comme revoquee", () => {
  assert.equal(certificateStatusLabels[CertificateStatus.REVOKED], "Révoquée");
});

test("student ne peut pas revoquer une attestation", () => {
  assert.equal(
    canRevokeCertificate(
      {
        id: "student-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      {
        supervisorUserId: "supervisor-1",
        issuedById: "admin-1",
      },
    ),
    false,
  );
});

test("attestation ISSUED est visible publiquement", () => {
  assert.equal(
    canViewCertificate(null, {
      status: CertificateStatus.ISSUED,
      studentUserId: "student-1",
      supervisorUserId: "supervisor-1",
      issuedById: "admin-1",
    }),
    true,
  );
});

test("erreurs Prisma attestation sont sanities", () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    {
      code: "P2002",
      clientVersion: "test",
    },
  );

  assert.equal(
    sanitizeCertificateActionError(duplicate),
    "Cette attestation entre en conflit avec des données déjà existantes.",
  );
});

test("validation de visibilite refuse un slug vide si le portfolio devient public", () => {
  const parsed = updatePortfolioVisibilitySchema.safeParse({
    isPortfolioPublic: "true",
    portfolioSlug: "",
  });

  assert.equal(parsed.success, false);
});

test("payload d'emission attestation valide", () => {
  const parsed = issueCertificateSchema.safeParse({
    studentId: "550e8400-e29b-41d4-a716-446655440000",
    projectId: "550e8400-e29b-41d4-a716-446655440001",
    title: "Attestation de contribution projet",
    summary: "Travail confirme sur un perimetre produit et technique coherent.",
  });

  assert.equal(parsed.success, true);
});

test("seul l'etudiant connecte peut gerer sa visibilite portfolio", () => {
  assert.equal(
    canManagePortfolioVisibility(
      {
        id: "student-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      "student-1",
    ),
    true,
  );
  assert.equal(
    canManagePortfolioVisibility(
      {
        id: "student-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      "student-2",
    ),
    false,
  );
});
