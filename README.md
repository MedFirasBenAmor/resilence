# Resilience Platform

Fondation technique minimale pour une application Next.js App Router avec Prisma et TypeScript strict.

## Prérequis

- Node.js 20+
- npm 10+
- PostgreSQL 15+

## Setup

1. Copier `.env.example` vers `.env`
2. Mettre à jour `DATABASE_URL` pour votre instance PostgreSQL
   Le couple `postgres:postgres` dans `.env.example` est un placeholder de dev et doit être remplacé par des identifiants valides sur votre machine.
3. Définir `NEXTAUTH_SECRET` avec une valeur longue et aléatoire
4. Installer les dépendances avec `npm install`
5. Générer Prisma avec `npm run prisma:generate`
6. Lancer le projet avec `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run auth:smoke`
- `npm run lint`
- `npm run prisma:seed`
- `npm run prisma:seed:demo`
- `npm run test`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## TypeScript

- `tsconfig.json` peut être enrichi automatiquement par Next.js avec `.next/types/**/*.ts` pendant `next build`
- `npm run typecheck` s'appuie donc sur [tsconfig.typecheck.json](./tsconfig.typecheck.json) pour garder un contrôle stable hors artefacts `.next`
- ce fichier couvre bien `src/app`, `src/actions`, `src/lib` et `src/components`, mais exclut `.next` et `tests`

## Authentification

Le MVP utilise une authentification credentials avec session JWT signée côté serveur.

- inscription publique réservée à `STUDENT`
- accès `SUPERVISOR` et `COMPANY` uniquement via invitation admin
- création de compte `ADMIN` désactivée depuis l'interface publique
- rôle lu depuis la session pour le middleware, puis revalidé côté serveur depuis Prisma pour les pages protégées

## Gate Auth/RBAC

- statut: `PASS`
- niveau de confiance: `High`
- aucun bug `Critical` ou `High` restant après vérification locale

## Base de données

Le schema Prisma MVP couvre:

- utilisateurs et profils par role;
- progression et validation académique des étudiants ;
- entreprises partenaires et projets fictifs ou réels ;
- candidatures, affectations, tâches et livrables ;
- feedback, scoring technique, maturité professionnelle ;
- attestations et portfolio.

Les migrations Prisma sont versionnées avec le projet et doivent être appliquées avant le premier lancement.

## Portfolio & attestations

- portfolio privé étudiant : `/dashboard/student/portfolio`
- portfolio public : `/portfolio/[slug]` uniquement si le profil a activé sa visibilité publique
- page de vérification d'attestation : `/certificates/[id]`

Le portfolio public reste volontairement conservateur pour le MVP:

- aucune donnée privée non nécessaire n'est exposée
- les feedbacks détaillés restent privés
- seuls les livrables validés, scores agrégés et attestations émises peuvent être exposés

## Entreprises

- dashboard entreprise MVP: `/dashboard/company`
- vues minimales disponibles : projets entreprise, talents affectés, livrables soumis, feedback entreprise, shortlist

## Audit

Le MVP enregistre des `AuditLog` pour les actions sensibles suivantes:

- approbation d'accès via invitation admin
- révocation ou expiration d'invitation admin
- acceptation ou rejet de candidature
- création ou réactivation de membership projet
- soumission et relecture de livrable
- creation de feedback superviseur ou entreprise
- création et vérification d'attestation

Vue admin:

- invitations et approbations : `/dashboard/admin/access`
- journal d'audit: `/dashboard/admin/audit`

## Bootstrap admin local

- commande Prisma standard: `npx prisma db seed`
- commande npm equivalente: `npm run prisma:seed`
- vérification rapide post-seed : `npm run auth:smoke`
- usage : crée ou met à jour un seul utilisateur `ADMIN` pour le développement local
- e-mail par défaut : `admin@resilience.local`
- mot de passe par défaut : `Admin123!`
- ces identifiants sont strictement réservés au développement local
- variables optionnelles : `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FIRST_NAME`, `SEED_ADMIN_LAST_NAME`, `SEED_ADMIN_PHONE`

Le smoke test auth local vérifie après seed :

- `admin@resilience.local / Admin123!`
- `supervisor@resilience.local / Supervisor123!`

Il échoue explicitement si un utilisateur manque, est inactif, a un mauvais rôle, n'a pas de `passwordHash` ou si le mot de passe ne correspond plus.

## Données de démo

- seed demo complet: `npm run prisma:seed:demo`
- prérequis seed : `DATABASE_URL` renseignée dans `.env`
- mot de passe de dev partagé pour tous les comptes de démo seedés : `DevPass123!`

Comptes de demo principaux:

- admin: `admin@demo.resilience.local`
- superviseur 1: `supervisor.archi@demo.resilience.local`
- superviseur 2: `supervisor.data@demo.resilience.local`
- entreprise 1: `contact@novacraft.demo.resilience.local`
- entreprise 2: `partnerships@greenloop.demo.resilience.local`
- étudiants : `*.@demo.resilience.local` définis dans [prisma/seed-data.ts](./prisma/seed-data.ts)

Exemples de portfolios publics seedés :

- `/portfolio/rayan-haddad`
- `/portfolio/mehdi-fekih`
- `/portfolio/leila-hammami`
- `/portfolio/omar-kallel`
