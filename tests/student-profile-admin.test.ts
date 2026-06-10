import test from "node:test";
import assert from "node:assert/strict";
import {
  AcademicValidationStatus,
  StudentLevel,
  StudentSubLevel,
  UserRole,
} from "@prisma/client";
import {
  canManageAcademicValidation,
  canUpdateAcademicValidationForStudent,
  normalizeSkillsInput,
  studentProfileSchema,
  studentValidationActionSchema,
} from "@/lib/validators/student";

test("update profil valide est accepte", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "Etudiante en progression qui construit un profil propre et verifiable pour ses candidatures.",
    phone: "+21671110001",
    cvUrl: "https://assets.demo.local/cv/amal-bensaid.pdf",
    linkedinUrl: "https://linkedin.demo.local/in/amal-bensaid",
    githubUrl: "https://github.demo.local/amal-bensaid",
    portfolioUrl: "https://portfolio.demo.local/amal-bensaid",
    skillsInput: "Next.js\nTypeScript\nPrisma",
    level: StudentLevel.LEVEL_2,
    subLevel: StudentSubLevel.LEVEL_2_EXECUTION,
    availability: "Disponible 15h par semaine",
    professionalGoal: "Contribuer a des produits SaaS B2B comme product engineer.",
  });

  assert.equal(result.success, true);
  assert.deepEqual(normalizeSkillsInput("Next.js\nTypeScript\nPrisma"), [
    "Next.js",
    "TypeScript",
    "Prisma",
  ]);
});

test("update profil avec URL invalide est rejete", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "Etudiante en progression qui construit un profil propre et verifiable pour ses candidatures.",
    phone: "",
    cvUrl: "not-a-url",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    skillsInput: "React, Prisma",
    level: StudentLevel.LEVEL_1,
    subLevel: StudentSubLevel.LEVEL_1_FOUNDATION,
    availability: "",
    professionalGoal: "Trouver un premier projet cadre pour monter en autonomie.",
  });

  assert.equal(result.success, false);
});

test("update profil avec URL GitHub invalide est rejete", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "Etudiante en progression qui construit un profil propre et verifiable pour ses candidatures.",
    phone: "",
    cvUrl: "",
    linkedinUrl: "",
    githubUrl: "https://gitlab.com/amal-bensaid",
    portfolioUrl: "",
    skillsInput: "React, Prisma",
    level: StudentLevel.LEVEL_1,
    subLevel: StudentSubLevel.LEVEL_1_FOUNDATION,
    availability: "",
    professionalGoal: "Trouver un premier projet cadre pour monter en autonomie.",
  });

  assert.equal(result.success, false);
});

test("update profil avec URL LinkedIn invalide est rejete", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "Etudiante en progression qui construit un profil propre et verifiable pour ses candidatures.",
    phone: "",
    cvUrl: "",
    linkedinUrl: "https://example.com/in/amal-bensaid",
    githubUrl: "",
    portfolioUrl: "",
    skillsInput: "React, Prisma",
    level: StudentLevel.LEVEL_1,
    subLevel: StudentSubLevel.LEVEL_1_FOUNDATION,
    availability: "",
    professionalGoal: "Trouver un premier projet cadre pour monter en autonomie.",
  });

  assert.equal(result.success, false);
});

test("update profil avec bio trop longue est rejete", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "a".repeat(1001),
    phone: "",
    cvUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    skillsInput: "React, Prisma",
    level: StudentLevel.LEVEL_1,
    subLevel: StudentSubLevel.LEVEL_1_FOUNDATION,
    availability: "",
    professionalGoal: "Trouver un premier projet cadre pour monter en autonomie.",
  });

  assert.equal(result.success, false);
});

test("update profil avec competences vides est rejete", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "Etudiante en progression qui construit un profil propre et verifiable pour ses candidatures.",
    phone: "",
    cvUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    skillsInput: ", \n ,",
    level: StudentLevel.LEVEL_1,
    subLevel: StudentSubLevel.LEVEL_1_FOUNDATION,
    availability: "",
    professionalGoal: "Trouver un premier projet cadre pour monter en autonomie.",
  });

  assert.equal(result.success, false);
});

test("update profil avec competence trop longue est rejete", () => {
  const result = studentProfileSchema.safeParse({
    displayName: "Amal Bensaid",
    bio: "Etudiante en progression qui construit un profil propre et verifiable pour ses candidatures.",
    phone: "",
    cvUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    skillsInput: `React, ${"x".repeat(61)}`,
    level: StudentLevel.LEVEL_1,
    subLevel: StudentSubLevel.LEVEL_1_FOUNDATION,
    availability: "",
    professionalGoal: "Trouver un premier projet cadre pour monter en autonomie.",
  });

  assert.equal(result.success, false);
});

test("admin peut valider un etudiant", () => {
  const actor = {
    id: "admin-1",
    role: UserRole.ADMIN,
    isActive: true,
  };

  assert.equal(canManageAcademicValidation(actor), true);
  assert.equal(canUpdateAcademicValidationForStudent(actor, "student-1"), true);

  const payload = studentValidationActionSchema.safeParse({
    studentProfileId: "550e8400-e29b-41d4-a716-446655440000",
    status: AcademicValidationStatus.VALIDATED,
  });

  assert.equal(payload.success, true);
});

test("etudiant tente de modifier son statut : refus", () => {
  const actor = {
    id: "student-1",
    role: UserRole.STUDENT,
    isActive: true,
  };

  assert.equal(canManageAcademicValidation(actor), false);
  assert.equal(canUpdateAcademicValidationForStudent(actor, "student-1"), false);
});

test("utilisateur non connecte : refus", () => {
  assert.equal(canManageAcademicValidation(null), false);
  assert.equal(canUpdateAcademicValidationForStudent(null, "student-1"), false);
});

test("superviseur ne peut pas modifier un statut academique", () => {
  const actor = {
    id: "supervisor-1",
    role: UserRole.SUPERVISOR,
    isActive: true,
  };

  assert.equal(canManageAcademicValidation(actor), false);
  assert.equal(canUpdateAcademicValidationForStudent(actor, "student-1"), false);
  assert.equal(canUpdateAcademicValidationForStudent(actor, "supervisor-1"), false);
});
