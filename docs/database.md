# Database MVP

## Niveaux etudiants

- `StudentLevel` porte les 3 niveaux `LEVEL_1`, `LEVEL_2`, `LEVEL_3`.
- `StudentSubLevel` affine la progression sans multiplier les tables.

## Acteurs

- `User` centralise l'authentification et le role principal.
- `StudentProfile`, `SupervisorProfile` et `CompanyProfile` ajoutent les donnees metier par role.
- `Company` represente l'entreprise, separee du compte utilisateur entreprise.

## Flux MVP

- `Project` couvre les projets fictifs et reels.
- `ProjectApplication` gere la candidature d'un etudiant a un projet.
- `ProjectMembership` represente l'affectation d'un etudiant retenu.
- `ProjectTask` et `Deliverable` permettent le suivi de l'execution.
- `Feedback`, `TechnicalScore` et `ProfessionalMaturityScore` couvrent l'evaluation.
- `Certificate` et `PortfolioItem` couvrent la valorisation finale.

## Tests manuels recommandes

- generation Prisma avec `npm run prisma:generate`
- creation d'un utilisateur `STUDENT` et de son `StudentProfile`
- creation d'un `Project` puis d'une `ProjectApplication`
- creation d'un `Feedback` puis d'un `TechnicalScore` rattache au meme etudiant
