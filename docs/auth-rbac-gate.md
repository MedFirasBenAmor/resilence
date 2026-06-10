# Auth RBAC Gate

## Statut

- conclusion: `PASS`
- niveau de confiance: `High`

## Autorite de securite

- le middleware ne constitue pas l'autorite finale d'autorisation
- toute page sensible doit utiliser `requireAuth` ou `requireRole`
- toute action serveur sensible doit utiliser `requireAuth` ou `requireRole`
- les roles doivent etre relus cote serveur depuis la base via Prisma
- le client ne doit jamais etre une source de verite pour le role

## Matrice d'acces

| Acteur | /dashboard/student | /dashboard/supervisor | /dashboard/company | /dashboard/admin |
| --- | --- | --- | --- | --- |
| Non connecte | Redirect login | Redirect login | Redirect login | Redirect login |
| STUDENT | Allow | Forbidden | Forbidden | Forbidden |
| SUPERVISOR | Forbidden | Allow | Forbidden | Forbidden |
| COMPANY | Forbidden | Forbidden | Allow | Forbidden |
| ADMIN | Forbidden | Forbidden | Forbidden | Allow |

## Verifications effectuees

- session cote serveur via Auth.js et verification finale via Prisma
- helper `requireAuth` verifie la presence de session et l'etat actif
- helper `requireRole` applique le controle d'acces par role cote serveur
- middleware utilise comme filtre rapide de redirection, pas comme autorite finale
- aucune donnee sensible de type `passwordHash` exposee au client
- aucune elevation de privilege possible a partir d'un role manipule cote client

## Bugs corriges pendant la gate

- redirection `next` du login durcie pour refuser les chemins externes ou ambigus
- resolution du role de dashboard rendue stricte pour eviter les faux positifs par prefixe
- contrat TypeScript des guards renforce pour refleter la garantie de refus ou d'autorisation

## Risque residuel

- le middleware s'appuie sur le token signe pour filtrer rapidement les acces
- apres un changement de role en base, un ancien token peut encore tenter une URL
- la page ou l'action protegee reste toutefois revalidee cote serveur via Prisma, donc il n'y a pas d'elevation effective de privilege

## Tests ajoutes

- validation register avec email invalide
- validation login avec email invalide
- verification mot de passe incorrect
- refus anonymes via decision `redirect-login`
- refus etudiant vers espace admin
- autorisation admin vers espace admin
- autorisation superviseur vers son espace
- autorisation entreprise limitee a son espace
- session inactive traitee comme non authentifiee
- rejet des redirections `next` non sures
- parsing strict des chemins dashboard

## Commandes executees

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
