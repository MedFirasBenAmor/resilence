# Sprint 2 Pilot Readiness

## Workflow Alignment

| Step | Status | Notes |
| --- | --- | --- |
| Student registration | Implemented | Public registration is limited to `STUDENT` and covered by server-side validation. |
| Project catalogue | Implemented | Students can browse and filter available projects compatible with their level and validation status. |
| Application | Implemented | Students can apply and withdraw while status and duplicate guards are enforced. |
| Assignment | Implemented | Accepting an application creates exactly one membership and enforces project capacity. |
| Project room | Implemented | Shared room exists for members, supervisors, admins and company readers with scoped permissions. |
| Deliverable | Implemented | Students can submit deliverables and supervisors can review them. |
| Feedback | Implemented | Supervisor and company feedback flows exist with audit logging. |
| Score / progression | Implemented | Technical, maturity and global score views are available for dashboards and progress pages. |
| Portfolio | Partially implemented | Student portfolio and public visibility controls exist, but exposure remains intentionally conservative. |
| Certificate / attestation | Partially implemented | Issue and revoke flows exist, with `DRAFT` and `ISSUED` states, but the pilot still relies on explicit manual issuance. |
| Dashboards | Implemented | Student, supervisor, company and admin dashboards are present. |
| Invitation email delivery | Missing | Admin invitation flow generates a secure activation link but does not send real emails. |

## Pilot Seed Profile

- 1 admin
- 2 supervisors
- 2 companies
- 10 students
- 5 level-1 pedagogical projects
- 2 level-2 company projects
- 1 level-3 advanced project
- 1 level-3 draft project

## Blocking Bugs Fixed

1. Supervisor invitation validation failed because `companyName` was absent from `FormData` for supervisor invitations and Zod rejected `null`.
2. Development bootstrap seed typecheck issue around nullable password hash verification was corrected.

## Remaining Gaps

1. No real email delivery for invitation links.
2. Portfolio evidence remains manually curated rather than automatically assembled from all validated work.
3. Certificate preparation exists, but the issuing workflow is still operationally manual.
4. Company dashboard remains intentionally MVP-level and not yet rich enough for broad external stakeholders.
5. End-to-end browser automation for server actions was not available in-session, so the pilot validation relies on action, schema and workflow tests plus successful build and seeding.

## Recommendation

Ready for a controlled MVP pilot with 10 students, provided the team accepts:

- manual sharing of invitation links,
- manual certificate issuance when needed,
- close admin/supervisor monitoring during the first cohort.

## Readiness Score

82 / 100
