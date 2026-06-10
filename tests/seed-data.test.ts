import test from "node:test";
import assert from "node:assert/strict";
import { ProjectType, StudentLevel, UserRole } from "@prisma/client";
import {
  projectApplications,
  seedProjects,
  seedUsers,
} from "../prisma/seed-data";

test("seed data contains one admin", () => {
  assert.equal(seedUsers.admin.role, UserRole.ADMIN);
});

test("pilot seed data targets 2 supervisors, 2 companies and 10 students", () => {
  assert.equal(seedUsers.supervisors.length, 2);
  assert.equal(seedUsers.companies.length, 2);
  assert.equal(seedUsers.students.length, 10);
});

test("seed data contains all three student levels", () => {
  const levels = new Set(seedUsers.students.map((student) => student.level));

  assert.equal(levels.has(StudentLevel.LEVEL_1), true);
  assert.equal(levels.has(StudentLevel.LEVEL_2), true);
  assert.equal(levels.has(StudentLevel.LEVEL_3), true);
});

test("seed data contains at least one project for each level", () => {
  const levels = new Set(seedProjects.map((project) => project.targetLevel));

  assert.equal(levels.has(StudentLevel.LEVEL_1), true);
  assert.equal(levels.has(StudentLevel.LEVEL_2), true);
  assert.equal(levels.has(StudentLevel.LEVEL_3), true);
});

test("seed data contains at least one application", () => {
  assert.equal(projectApplications.length > 0, true);
});

test("pilot seed data contains five level-1 pedagogical projects", () => {
  const level1Pedagogical = seedProjects.filter(
    (project) =>
      project.targetLevel === StudentLevel.LEVEL_1 &&
      project.type === ProjectType.FICTIONAL,
  );

  assert.equal(level1Pedagogical.length, 5);
});

test("pilot seed data contains two level-2 company projects", () => {
  const level2CompanyProjects = seedProjects.filter(
    (project) =>
      project.targetLevel === StudentLevel.LEVEL_2 &&
      project.type === ProjectType.REAL &&
      project.companyName,
  );

  assert.equal(level2CompanyProjects.length, 2);
});
