import {
  ApplicationStatus,
  CompanyProjectRequestStatus,
  DeliverableStatus,
  FeedbackSource,
  ProjectStatus,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export type CompanyDashboardData = {
  companyName: string;
  contactName: string;
  kpis: {
    projects: number;
    assignedStudents: number;
    submittedDeliverables: number;
    shortlistCandidates: number;
  };
  projects: Array<{
    id: string;
    title: string;
    status: ProjectStatus;
    targetLevel: StudentLevel;
    activeStudents: number;
    pendingApplications: number;
    roomHref: string;
  }>;
  assignedStudents: Array<{
    membershipId: string;
    projectId: string;
    projectTitle: string;
    studentName: string;
    studentEmail: string;
    level: StudentLevel;
    roleLabel: string | null;
    feedbackCount: number;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    projectId: string;
    projectTitle: string;
    studentName: string | null;
    status: DeliverableStatus;
    submittedAt: Date | null;
    roomHref: string;
  }>;
  shortlist: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    studentName: string;
    studentEmail: string;
    level: StudentLevel;
    status: ApplicationStatus;
    motivation: string | null;
    createdAt: Date;
  }>;
  projectRequests: Array<{
    id: string;
    title: string;
    status: CompanyProjectRequestStatus;
    shortSummary: string;
    createdAt: Date;
    convertedProjectId: string | null;
  }>;
};

export async function getCompanyDashboardData(): Promise<CompanyDashboardData> {
  const actor = await requireRole(UserRole.COMPANY, "/dashboard/company");
  const profile = await prisma.companyProfile.findUnique({
    where: { userId: actor.id },
    select: {
      companyId: true,
      company: {
        select: {
          name: true,
          projects: {
            orderBy: [{ updatedAt: "desc" }],
            select: {
              id: true,
              title: true,
              status: true,
              targetLevel: true,
              _count: {
                select: {
                  memberships: {
                    where: {
                      isActive: true,
                    },
                  },
                  applications: {
                    where: {
                      status: {
                        in: [ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Profil entreprise introuvable.");
  }

  const [memberships, deliverables, applications, projectRequests] = await prisma.$transaction([
    prisma.projectMembership.findMany({
      where: {
        isActive: true,
        project: {
          companyId: profile.companyId,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        roleLabel: true,
        projectId: true,
        project: {
          select: {
            title: true,
          },
        },
        student: {
          select: {
            id: true,
            level: true,
            displayName: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            receivedFeedbacks: {
              where: {
                source: FeedbackSource.COMPANY,
                project: {
                  companyId: profile.companyId,
                },
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    }),
    prisma.deliverable.findMany({
      where: {
        project: {
          companyId: profile.companyId,
        },
      },
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        submittedAt: true,
        projectId: true,
        project: {
          select: {
            title: true,
          },
        },
        membership: {
          select: {
            student: {
              select: {
                displayName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.projectApplication.findMany({
      where: {
        project: {
          companyId: profile.companyId,
        },
        status: {
          in: [
            ApplicationStatus.PENDING,
            ApplicationStatus.SHORTLISTED,
            ApplicationStatus.ACCEPTED,
          ],
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        status: true,
        motivation: true,
        createdAt: true,
        projectId: true,
        project: {
          select: {
            title: true,
          },
        },
        student: {
          select: {
            level: true,
            displayName: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.companyProjectRequest.findMany({
      where: {
        companyId: profile.companyId,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        shortSummary: true,
        createdAt: true,
        convertedProjectId: true,
      },
    }),
  ]);

  return {
    companyName: profile.company.name,
    contactName: `${profile.user.firstName} ${profile.user.lastName}`.trim(),
    kpis: {
      projects: profile.company.projects.length,
      assignedStudents: memberships.length,
      submittedDeliverables: deliverables.filter((item) => item.status !== DeliverableStatus.DRAFT).length,
      shortlistCandidates: applications.length,
    },
    projects: profile.company.projects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      targetLevel: project.targetLevel,
      activeStudents: project._count.memberships,
      pendingApplications: project._count.applications,
      roomHref: `/dashboard/projects/${project.id}/room`,
    })),
    assignedStudents: memberships.map((membership) => ({
      membershipId: membership.id,
      projectId: membership.projectId,
      projectTitle: membership.project.title,
      studentName:
        membership.student.displayName ??
        `${membership.student.user.firstName} ${membership.student.user.lastName}`.trim(),
      studentEmail: membership.student.user.email,
      level: membership.student.level,
      roleLabel: membership.roleLabel,
      feedbackCount: membership.student.receivedFeedbacks.length,
    })),
    deliverables: deliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      projectId: deliverable.projectId,
      projectTitle: deliverable.project.title,
      studentName: deliverable.membership
        ? deliverable.membership.student.displayName ??
          `${deliverable.membership.student.user.firstName} ${deliverable.membership.student.user.lastName}`.trim()
        : null,
      status: deliverable.status,
      submittedAt: deliverable.submittedAt,
      roomHref: `/dashboard/projects/${deliverable.projectId}/room`,
    })),
    shortlist: applications.map((application) => ({
      id: application.id,
      projectId: application.projectId,
      projectTitle: application.project.title,
      studentName:
        application.student.displayName ??
        `${application.student.user.firstName} ${application.student.user.lastName}`.trim(),
      studentEmail: application.student.user.email,
      level: application.student.level,
      status: application.status,
      motivation: application.motivation,
      createdAt: application.createdAt,
    })),
    projectRequests,
  };
}
