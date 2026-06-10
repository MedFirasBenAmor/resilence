import {
  CertificateStatus,
  DeliverableStatus,
  FeedbackSource,
  ProjectStatus,
  ProjectType,
  StudentLevel,
  StudentSubLevel,
  UserRole,
} from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  buildPublicPortfolioPath,
  canViewPrivatePortfolio,
  canViewPublicPortfolio,
} from "@/lib/portfolio-access";
import {
  calculateGlobalScore,
  calculateMaturityAverage,
  calculateTechnicalAverage,
} from "@/lib/scoring";
import { requireRole } from "@/lib/rbac";

export type PortfolioProjectRow = {
  id: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  type: ProjectType;
  roleLabel: string | null;
  startDate: Date | null;
  endDate: Date | null;
  roomHref: string;
  companyName: string | null;
};

export type PortfolioDeliverableRow = {
  id: string;
  title: string;
  description: string | null;
  projectTitle: string;
  status: DeliverableStatus;
  submissionUrl: string | null;
  repositoryUrl: string | null;
  reviewedAt: Date | null;
};

export type PortfolioFeedbackRow = {
  id: string;
  title: string | null;
  comment: string;
  createdAt: Date;
  source: FeedbackSource;
  projectTitle: string | null;
  evaluatorName: string | null;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
};

export type PortfolioCertificateRow = {
  id: string;
  title: string;
  status: CertificateStatus;
  referenceCode: string;
  verificationCode: string;
  projectTitle: string | null;
  issuedAt: Date | null;
};

export type StudentPortfolioData = {
  profile: {
    studentId: string;
    userId: string;
    fullName: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    level: StudentLevel;
    subLevel: StudentSubLevel;
    skills: string[];
    cvUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    isPortfolioPublic: boolean;
    portfolioSlug: string | null;
    publicPortfolioPath: string | null;
  };
  scoreSummary: {
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
  };
  projects: PortfolioProjectRow[];
  deliverables: PortfolioDeliverableRow[];
  feedbacks: PortfolioFeedbackRow[];
  certificates: PortfolioCertificateRow[];
};

export type PublicPortfolioData = {
  fullName: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  level: StudentLevel;
  subLevel: StudentSubLevel;
  skills: string[];
  cvUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  projects: PortfolioProjectRow[];
  deliverables: PortfolioDeliverableRow[];
  certificates: PortfolioCertificateRow[];
  scoreSummary: {
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
  };
};

function averageScores(values: Array<{ score: number }>) {
  return values.length ? values.map((entry) => entry.score) : [];
}

function buildFeedbackAverage(feedback: {
  technicalScores: Array<{ score: number }>;
  maturityScores: Array<{ score: number }>;
}) {
  const technicalAverage = calculateTechnicalAverage(
    averageScores(feedback.technicalScores),
  );
  const maturityAverage = calculateMaturityAverage(
    averageScores(feedback.maturityScores),
  );

  return {
    technicalAverage,
    maturityAverage,
    globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
  };
}

function toDisplayName(input: {
  displayName: string | null;
  firstName: string;
  lastName: string;
}) {
  return input.displayName?.trim() || `${input.firstName} ${input.lastName}`;
}

export async function getStudentPortfolioData(): Promise<StudentPortfolioData> {
  const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/portfolio");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: actor.id },
    select: {
      id: true,
      displayName: true,
      headline: true,
      bio: true,
      level: true,
      subLevel: true,
      skills: true,
      cvUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      portfolioUrl: true,
      isPortfolioPublic: true,
      portfolioSlug: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!profile || !canViewPrivatePortfolio(actor, profile.user.id)) {
    notFound();
  }

  const [memberships, deliverables, feedbacks, technicalScores, maturityScores, certificates] =
    await prisma.$transaction([
      prisma.projectMembership.findMany({
        where: {
          studentId: profile.id,
          project: {
            status: {
              in: [ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED],
            },
          },
        },
        orderBy: [
          {
            project: {
              updatedAt: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          project: {
            select: {
              id: true,
              title: true,
              summary: true,
              status: true,
              type: true,
              startDate: true,
              endDate: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
          roleLabel: true,
        },
      }),
      prisma.deliverable.findMany({
        where: {
          membership: {
            studentId: profile.id,
          },
          status: DeliverableStatus.APPROVED,
        },
        orderBy: {
          reviewedAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          title: true,
          description: true,
          submissionUrl: true,
          repositoryUrl: true,
          status: true,
          reviewedAt: true,
          project: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.feedback.findMany({
        where: {
          studentId: profile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          title: true,
          comment: true,
          createdAt: true,
          source: true,
          project: {
            select: {
              title: true,
            },
          },
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          technicalScores: {
            select: {
              score: true,
            },
          },
          maturityScores: {
            select: {
              score: true,
            },
          },
        },
      }),
      prisma.technicalScore.findMany({
        where: {
          studentId: profile.id,
        },
        select: {
          score: true,
        },
      }),
      prisma.professionalMaturityScore.findMany({
        where: {
          studentId: profile.id,
        },
        select: {
          score: true,
        },
      }),
      prisma.certificate.findMany({
        where: {
          studentId: profile.id,
        },
        orderBy: [
          {
            issuedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          referenceCode: true,
          verificationCode: true,
          projectTitleSnapshot: true,
          issuedAt: true,
        },
      }),
    ]);

  const technicalAverage = calculateTechnicalAverage(averageScores(technicalScores));
  const maturityAverage = calculateMaturityAverage(averageScores(maturityScores));
  const globalScore = calculateGlobalScore(technicalAverage, maturityAverage);

  return {
    profile: {
      studentId: profile.id,
      userId: profile.user.id,
      fullName: `${profile.user.firstName} ${profile.user.lastName}`,
      displayName: toDisplayName({
        displayName: profile.displayName,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
      }),
      headline: profile.headline,
      bio: profile.bio,
      level: profile.level,
      subLevel: profile.subLevel,
      skills: profile.skills,
      cvUrl: profile.cvUrl,
      githubUrl: profile.githubUrl,
      linkedinUrl: profile.linkedinUrl,
      portfolioUrl: profile.portfolioUrl,
      isPortfolioPublic: profile.isPortfolioPublic,
      portfolioSlug: profile.portfolioSlug,
      publicPortfolioPath:
        profile.isPortfolioPublic && profile.portfolioSlug
          ? buildPublicPortfolioPath(profile.portfolioSlug)
          : null,
    },
    scoreSummary: {
      technicalAverage,
      maturityAverage,
      globalScore,
    },
    projects: memberships.map((membership) => ({
      id: membership.project.id,
      title: membership.project.title,
      summary: membership.project.summary,
      status: membership.project.status,
      type: membership.project.type,
      roleLabel: membership.roleLabel,
      startDate: membership.project.startDate,
      endDate: membership.project.endDate,
      roomHref: `/dashboard/projects/${membership.project.id}/room`,
      companyName: membership.project.company?.name ?? null,
    })),
    deliverables: deliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description,
      projectTitle: deliverable.project.title,
      status: deliverable.status,
      submissionUrl: deliverable.submissionUrl,
      repositoryUrl: deliverable.repositoryUrl,
      reviewedAt: deliverable.reviewedAt,
    })),
    feedbacks: feedbacks.map((feedback) => {
      const averages = buildFeedbackAverage(feedback);

      return {
        id: feedback.id,
        title: feedback.title,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        source: feedback.source,
        projectTitle: feedback.project?.title ?? null,
        evaluatorName: feedback.author
          ? `${feedback.author.firstName} ${feedback.author.lastName}`
          : null,
        ...averages,
      };
    }),
    certificates: certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.title,
      status: certificate.status,
      referenceCode: certificate.referenceCode,
      verificationCode: certificate.verificationCode,
      projectTitle: certificate.projectTitleSnapshot,
      issuedAt: certificate.issuedAt,
    })),
  };
}

export async function getPublicPortfolioData(
  slug: string,
): Promise<PublicPortfolioData | null> {
  const profile = await prisma.studentProfile.findUnique({
    where: { portfolioSlug: slug },
    select: {
      id: true,
      displayName: true,
      headline: true,
      bio: true,
      level: true,
      subLevel: true,
      skills: true,
      cvUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      portfolioUrl: true,
      isPortfolioPublic: true,
      portfolioSlug: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!profile || !canViewPublicPortfolio(profile)) {
    return null;
  }

  const [memberships, deliverables, technicalScores, maturityScores, certificates] =
    await prisma.$transaction([
      prisma.projectMembership.findMany({
        where: {
          studentId: profile.id,
          project: {
            status: {
              in: [ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED],
            },
          },
        },
        orderBy: [
          {
            project: {
              updatedAt: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: 6,
        select: {
          project: {
            select: {
              id: true,
              title: true,
              summary: true,
              status: true,
              type: true,
              startDate: true,
              endDate: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
          roleLabel: true,
        },
      }),
      prisma.deliverable.findMany({
        where: {
          membership: {
            studentId: profile.id,
          },
          status: DeliverableStatus.APPROVED,
        },
        orderBy: {
          reviewedAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          submissionUrl: true,
          repositoryUrl: true,
          status: true,
          reviewedAt: true,
          project: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.technicalScore.findMany({
        where: {
          studentId: profile.id,
        },
        select: {
          score: true,
        },
      }),
      prisma.professionalMaturityScore.findMany({
        where: {
          studentId: profile.id,
        },
        select: {
          score: true,
        },
      }),
      prisma.certificate.findMany({
        where: {
          studentId: profile.id,
          status: {
            in: [CertificateStatus.ISSUED, CertificateStatus.REVOKED],
          },
        },
        orderBy: [
          {
            issuedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          referenceCode: true,
          verificationCode: true,
          projectTitleSnapshot: true,
          issuedAt: true,
        },
      }),
    ]);

  const technicalAverage = calculateTechnicalAverage(averageScores(technicalScores));
  const maturityAverage = calculateMaturityAverage(averageScores(maturityScores));
  const globalScore = calculateGlobalScore(technicalAverage, maturityAverage);

  return {
    fullName: `${profile.user.firstName} ${profile.user.lastName}`,
    displayName: toDisplayName({
      displayName: profile.displayName,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
    }),
    headline: profile.headline,
    bio: profile.bio,
    level: profile.level,
    subLevel: profile.subLevel,
    skills: profile.skills,
    cvUrl: profile.cvUrl,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
    projects: memberships.map((membership) => ({
      id: membership.project.id,
      title: membership.project.title,
      summary: membership.project.summary,
      status: membership.project.status,
      type: membership.project.type,
      roleLabel: membership.roleLabel,
      startDate: membership.project.startDate,
      endDate: membership.project.endDate,
      roomHref: "",
      companyName: membership.project.company?.name ?? null,
    })),
    deliverables: deliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description,
      projectTitle: deliverable.project.title,
      status: deliverable.status,
      submissionUrl: deliverable.submissionUrl,
      repositoryUrl: deliverable.repositoryUrl,
      reviewedAt: deliverable.reviewedAt,
    })),
    certificates: certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.title,
      status: certificate.status,
      referenceCode: certificate.referenceCode,
      verificationCode: certificate.verificationCode,
      projectTitle: certificate.projectTitleSnapshot,
      issuedAt: certificate.issuedAt,
    })),
    scoreSummary: {
      technicalAverage,
      maturityAverage,
      globalScore,
    },
  };
}

export async function requirePublicPortfolioData(slug: string) {
  const data = await getPublicPortfolioData(slug);

  if (!data) {
    notFound();
  }

  return data;
}
