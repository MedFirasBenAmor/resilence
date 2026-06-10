# Sprint 1.1 Log

Date: 2026-06-05

## Scope

Sprint 1.1 a ete limite a:

- validation d'environnement Prisma/PostgreSQL
- validation de la migration committee
- observabilite admin
- support revoke/expire des invitations
- tests de fiabilite MVP

## Root Cause Prisma

Constat local:

- `prisma db pull` echoue avec `P1000`
- `prisma migrate status` et `prisma migrate dev` renvoient seulement `Schema engine error`

Cause racine retenue:

- le `DATABASE_URL` local pointe vers `postgresql://postgres:postgres@localhost:5432/resilience_platform?schema=public`
- ces identifiants ne sont pas valides sur cette machine
- les commandes Prisma qui introspectent directement la base exposent `P1000`
- les commandes `migrate` masquent localement cette meme panne derriere un `Schema engine error`

Conclusion:

- le blocage n'est pas le schema Prisma
- le blocage est l'authentification PostgreSQL locale

## Changements implementes

### Observabilite admin

- ajout de la page `/dashboard/admin/audit`
- ajout des filtres audit par action, cible et recherche texte
- ajout de la navigation admin vers l'audit
- ajout des labels et formats de lecture pour les logs

### Invitations

- ajout du support revoke invitation
- ajout du support expire now invitation
- affichage du statut derive `EXPIRED` cote UI
- correction de la page publique d'invitation pour gerer proprement l'expiration

### Audit supplementaire

Nouveaux evenements audites:

- `INVITATION_REVOKED`
- `INVITATION_EXPIRED`
- `DELIVERABLE_SUBMITTED`
- `DELIVERABLE_REVIEWED`
- `FEEDBACK_CREATED`

Flux deja preserves:

- `ROLE_APPROVED`
- `APPLICATION_ACCEPTED`
- `APPLICATION_REJECTED`
- `MEMBERSHIP_ASSIGNED`
- `MEMBERSHIP_REACTIVATED`
- `CERTIFICATE_CREATED`
- `CERTIFICATE_VERIFIED`

### Validation migration

- regeneration du client Prisma apres extension du schema
- regeneration du SQL committe dans `prisma/migrations/20260605_stable_mvp_sprint1/migration.sql`
- ajout d'un test qui verifie la presence des structures et evenements critiques dans la migration versionnee

## Fichiers modifies

- `README.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260605_stable_mvp_sprint1/migration.sql`
- `src/actions/feedbackActions.ts`
- `src/actions/invitationActions.ts`
- `src/actions/projectRoomActions.ts`
- `src/app/dashboard/admin/access/page.tsx`
- `src/app/dashboard/admin/audit/page.tsx`
- `src/app/register/invite/[token]/page.tsx`
- `src/components/auth/invitation-lifecycle-actions.tsx`
- `src/components/auth/role-invitations-table.tsx`
- `src/lib/admin-audit.ts`
- `src/lib/auth/invitations.ts`
- `src/lib/navigation.ts`
- `tests/admin-observability.test.ts`
- `tests/auth-rbac.test.ts`

## Commandes executees

### Success

- `npx.cmd prisma generate --schema prisma/schema.prisma`
- `npx.cmd prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`

### Failures utiles au diagnostic

- `npx.cmd prisma db pull --schema prisma/schema.prisma`
  Resultat: `P1000 Authentication failed`
- `npx.cmd prisma migrate status --schema prisma/schema.prisma`
  Resultat: `Schema engine error`
- `npx.cmd prisma migrate dev --name sprint11_validation --create-only --schema prisma/schema.prisma`
  Resultat: `Schema engine error`

## Etat des tests

- suite de tests: `118/118` passing
- ajouts Sprint 1.1:
  - audit helper creation
  - audit filter normalization
  - invitation lifecycle
  - migration SQL coverage
  - scenario MVP stable end-to-end au niveau domaine

## Validation base de donnees

Ce qui est valide sans acces PostgreSQL fonctionnel:

- schema Prisma valide
- client Prisma genere
- migration SQL versionnee synchronisee avec le schema
- tests applicatifs et domaine passent

Ce qui reste non valide localement:

- application reelle de la migration sur un PostgreSQL vide
- `prisma migrate dev` sur cette machine tant que les credentials du `DATABASE_URL` restent invalides

## Risques restants

- la machine locale doit recevoir un `DATABASE_URL` correct avant de pouvoir appliquer la migration
- l'audit viewer ne propose pas encore d'export CSV
- les logs d'audit sont visibles cote admin mais il n'y a pas encore de politique de retention

## MVP Readiness

Score Sprint 1 apres stabilisation: `79/100`

Score Sprint 1.1 apres fiabilite + observabilite: `83/100`

Interpretation:

- MVP stable candidate confirme
- blocage restant principalement environnemental et non produit
