import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("back button component uses router.back with fallback push", async () => {
  const source = await readFile("src/components/navigation/back-button.tsx", "utf8");

  assert.match(source, /router\.back\(\)/);
  assert.match(source, /router\.push\(fallbackHref\)/);
  assert.match(source, /label = "Retour"/);
});

test("deep detail pages wire explicit back button fallbacks", async () => {
  const studentProject = await readFile("src/app/dashboard/student/projects/[id]/page.tsx", "utf8");
  const adminProject = await readFile("src/app/dashboard/admin/projects/[id]/page.tsx", "utf8");
  const supervisorProject = await readFile("src/app/dashboard/supervisor/projects/[id]/page.tsx", "utf8");
  const room = await readFile("src/app/dashboard/projects/[id]/room/page.tsx", "utf8");
  const evaluation = await readFile("src/app/dashboard/supervisor/projects/[id]/evaluate/page.tsx", "utf8");
  const portfolio = await readFile("src/app/portfolio/[slug]/page.tsx", "utf8");
  const certificate = await readFile("src/app/certificates/[id]/page.tsx", "utf8");
  const requestDetail = await readFile("src/app/dashboard/admin/project-requests/[id]/page.tsx", "utf8");

  assert.match(studentProject, /fallbackHref="\/dashboard\/student\/projects"/);
  assert.match(adminProject, /fallbackHref="\/dashboard\/admin\/projects"/);
  assert.match(supervisorProject, /fallbackHref="\/dashboard\/supervisor\/projects"/);
  assert.match(room, /viewerRole/);
  assert.match(room, /\/dashboard\/student\/projects\/\$\{room\.project\.id\}/);
  assert.match(room, /\/dashboard\/supervisor\/projects\/\$\{room\.project\.id\}/);
  assert.match(room, /\/dashboard\/admin\/projects\/\$\{room\.project\.id\}/);
  assert.match(evaluation, /fallbackHref="\/dashboard\/supervisor\/projects"/);
  assert.match(portfolio, /fallbackHref="\/dashboard\/student\/portfolio"/);
  assert.match(certificate, /fallbackHref="\/dashboard"/);
  assert.match(requestDetail, /fallbackHref="\/dashboard\/admin\/project-requests"/);
});
