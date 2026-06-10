import "dotenv/config";
import {
  AcademicValidationStatus,
  PrismaClient,
  UserRole,
  type DeliverableStatus,
  type FeedbackSource,
  type ProjectStatus,
  type ProjectType,
  type StudentLevel,
  type TaskStatus,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import {
  certificates,
  deliverables,
  DEMO_PASSWORD,
  feedbacks,
  memberships,
  maturityScores,
  portfolioItems,
  projectApplications,
  projectTasks,
  seedProjects,
  seedUsers,
  technicalScores,
} from "./seed-data";

const prisma = new PrismaClient();

type UserRecord = {
  id: string;
  email: string;
  role: UserRole;
};

type SupervisorRecord = {
  userId: string;
  profileId: string;
  email: string;
};

type StudentRecord = {
  id: string;
  email: string;
};

type ProjectRecord = {
  id: string;
  key: string;
  title: string;
};

type MembershipRecord = {
  id: string;
  projectKey: string;
  studentEmail: string;
};

type TaskRecord = {
  id: string;
  projectKey: string;
  title: string;
};

type DeliverableRecord = {
  id: string;
  title: string;
};

type FeedbackRecord = {
  id: string;
  title: string | null;
};

function dateOrNull(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function getFeedbackKey(input: { title: string | null; comment: string }) {
  return input.title ?? input.comment;
}

async function upsertUser(
  data: {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string | null;
  },
  passwordHash: string,
) {
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone ?? null,
      isActive: true,
      passwordHash,
    },
    create: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone ?? null,
      isActive: true,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return user satisfies UserRecord;
}

async function upsertProject(input: {
  title: string;
  summary: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  targetLevel: StudentLevel;
  companyId: string | null;
  supervisorId: string | null;
  createdById: string;
  capacity: number;
}) {
  const existing = await prisma.project.findFirst({
    where: {
      title: input.title,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.project.update({
      where: { id: existing.id },
      data: input,
      select: { id: true, title: true },
    });
  }

  return prisma.project.create({
    data: input,
    select: { id: true, title: true },
  });
}

async function upsertTask(input: {
  projectId: string;
  membershipId: string | null;
  createdById: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
}) {
  const existing = await prisma.projectTask.findFirst({
    where: {
      projectId: input.projectId,
      title: input.title,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.projectTask.update({
      where: { id: existing.id },
      data: input,
      select: { id: true, title: true },
    });
  }

  return prisma.projectTask.create({
    data: input,
    select: { id: true, title: true },
  });
}

async function upsertDeliverable(input: {
  projectId: string;
  membershipId: string | null;
  taskId: string | null;
  reviewedById: string | null;
  title: string;
  description: string;
  submissionUrl: string;
  repositoryUrl: string;
  status: DeliverableStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
}) {
  const existing = await prisma.deliverable.findFirst({
    where: {
      projectId: input.projectId,
      title: input.title,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.deliverable.update({
      where: { id: existing.id },
      data: input,
      select: { id: true, title: true },
    });
  }

  return prisma.deliverable.create({
    data: input,
    select: { id: true, title: true },
  });
}

async function upsertFeedback(input: {
  studentId: string;
  projectId: string | null;
  membershipId: string | null;
  deliverableId: string | null;
  authorId: string | null;
  source: FeedbackSource;
  title: string | null;
  comment: string;
  rating: number | null;
}) {
  const existing = await prisma.feedback.findFirst({
    where: {
      studentId: input.studentId,
      projectId: input.projectId,
      title: input.title,
      comment: input.comment,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.feedback.update({
      where: { id: existing.id },
      data: input,
      select: { id: true, title: true },
    });
  }

  return prisma.feedback.create({
    data: input,
    select: { id: true, title: true },
  });
}

async function upsertTechnicalScore(input: {
  studentId: string;
  projectId: string | null;
  feedbackId: string | null;
  evaluatorId: string | null;
  category: string;
  score: number;
  maxScore: number;
  notes: string;
}) {
  const existing = await prisma.technicalScore.findFirst({
    where: {
      studentId: input.studentId,
      category: input.category,
      feedbackId: input.feedbackId,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.technicalScore.update({
      where: { id: existing.id },
      data: input,
    });
  }

  return prisma.technicalScore.create({
    data: input,
  });
}

async function upsertMaturityScore(input: {
  studentId: string;
  projectId: string | null;
  feedbackId: string | null;
  evaluatorId: string | null;
  dimension: string;
  score: number;
  maxScore: number;
  notes: string;
}) {
  const existing = await prisma.professionalMaturityScore.findFirst({
    where: {
      studentId: input.studentId,
      dimension: input.dimension,
      feedbackId: input.feedbackId,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.professionalMaturityScore.update({
      where: { id: existing.id },
      data: input,
    });
  }

  return prisma.professionalMaturityScore.create({
    data: input,
  });
}

async function upsertPortfolioItem(input: {
  studentId: string;
  projectId: string | null;
  title: string;
  summary: string;
  description: string;
  demoUrl: string;
  repositoryUrl: string;
  isPublished: boolean;
  sortOrder: number;
}) {
  const existing = await prisma.portfolioItem.findFirst({
    where: {
      studentId: input.studentId,
      title: input.title,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.portfolioItem.update({
      where: { id: existing.id },
      data: input,
    });
  }

  return prisma.portfolioItem.create({
    data: input,
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run prisma/seed.ts");
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await upsertUser(seedUsers.admin, passwordHash);

  const supervisorMap = new Map<string, SupervisorRecord>();
  for (const supervisor of seedUsers.supervisors) {
    const user = await upsertUser(supervisor, passwordHash);

    const profile = await prisma.supervisorProfile.upsert({
      where: { userId: user.id },
      update: {
        title: supervisor.title,
        department: supervisor.department,
        expertiseArea: supervisor.expertiseArea,
        organization: supervisor.organization,
      },
      create: {
        userId: user.id,
        title: supervisor.title,
        department: supervisor.department,
        expertiseArea: supervisor.expertiseArea,
        organization: supervisor.organization,
      },
      select: {
        id: true,
      },
    });

    supervisorMap.set(user.email, {
      userId: user.id,
      profileId: profile.id,
      email: user.email,
    });
  }

  const companyMap = new Map<string, { id: string; name: string }>();
  const companyUserMap = new Map<string, UserRecord>();
  for (const companyUser of seedUsers.companies) {
    const user = await upsertUser(companyUser, passwordHash);

    const company = await prisma.company.upsert({
      where: { name: companyUser.company.name },
      update: {
        website: companyUser.company.website,
        description: companyUser.company.description,
        industry: companyUser.company.industry,
        isActive: true,
      },
      create: {
        name: companyUser.company.name,
        website: companyUser.company.website,
        description: companyUser.company.description,
        industry: companyUser.company.industry,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await prisma.companyProfile.upsert({
      where: { userId: user.id },
      update: {
        companyId: company.id,
        jobTitle: companyUser.jobTitle,
        department: companyUser.department,
      },
      create: {
        userId: user.id,
        companyId: company.id,
        jobTitle: companyUser.jobTitle,
        department: companyUser.department,
      },
    });

    companyMap.set(company.name, company);
    companyUserMap.set(user.email, user);
  }

  const studentMap = new Map<string, StudentRecord>();
  const userMap = new Map<string, UserRecord>();
  userMap.set(admin.email, admin);
  supervisorMap.forEach((value) =>
    userMap.set(value.email, {
      id: value.userId,
      email: value.email,
      role: UserRole.SUPERVISOR,
    }),
  );
  companyUserMap.forEach((value) => userMap.set(value.email, value));

  for (const student of seedUsers.students) {
    const user = await upsertUser(
      {
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: UserRole.STUDENT,
        phone: student.phone,
      },
      passwordHash,
    );

    const validationUserId =
      student.academicValidationStatus === AcademicValidationStatus.VALIDATED
        ? admin.id
        : null;

    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        level: student.level,
        subLevel: student.subLevel,
        headline: student.headline,
        bio: student.bio,
        skillsSummary: student.skillsSummary,
        academicInstitution: student.academicInstitution,
        programName: student.programName,
        graduationYear: student.graduationYear,
        academicValidationStatus: student.academicValidationStatus,
        academicValidatedById: validationUserId,
        academicValidatedAt: validationUserId ? new Date("2026-05-01T09:00:00.000Z") : null,
        cvUrl: student.cvUrl,
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        portfolioUrl: student.portfolioUrl,
        isPortfolioPublic: student.isPortfolioPublic,
        portfolioSlug: student.portfolioSlug,
      },
      create: {
        userId: user.id,
        level: student.level,
        subLevel: student.subLevel,
        headline: student.headline,
        bio: student.bio,
        skillsSummary: student.skillsSummary,
        academicInstitution: student.academicInstitution,
        programName: student.programName,
        graduationYear: student.graduationYear,
        academicValidationStatus: student.academicValidationStatus,
        academicValidatedById: validationUserId,
        academicValidatedAt: validationUserId ? new Date("2026-05-01T09:00:00.000Z") : null,
        cvUrl: student.cvUrl,
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        portfolioUrl: student.portfolioUrl,
        isPortfolioPublic: student.isPortfolioPublic,
        portfolioSlug: student.portfolioSlug,
      },
      select: {
        id: true,
      },
    });

    userMap.set(user.email, user);
    studentMap.set(student.email, { id: profile.id, email: student.email });
  }

  const projectMap = new Map<string, ProjectRecord>();
  for (const project of seedProjects) {
    const supervisor = supervisorMap.get(project.supervisorEmail);
    const createdBy = userMap.get(project.createdByEmail);
    const company = project.companyName ? companyMap.get(project.companyName) : null;

    if (!supervisor || !createdBy) {
      throw new Error(`Missing project relation for ${project.key}`);
    }

    const projectRecord = await upsertProject({
      title: project.title,
      summary: project.summary,
      description: project.description,
      type: project.type,
      status: project.status,
      targetLevel: project.targetLevel,
      companyId: company?.id ?? null,
      supervisorId: supervisor.profileId,
      createdById: createdBy.id,
      capacity: project.capacity,
    });

    projectMap.set(project.key, {
      id: projectRecord.id,
      key: project.key,
      title: projectRecord.title,
    });
  }

  for (const application of projectApplications) {
    const project = projectMap.get(application.projectKey);
    const student = studentMap.get(application.studentEmail);
    const reviewedBy = application.reviewedByEmail
      ? userMap.get(application.reviewedByEmail)
      : null;

    if (!project || !student) {
      throw new Error(`Missing application relation for ${application.projectKey}/${application.studentEmail}`);
    }

    await prisma.projectApplication.upsert({
      where: {
        projectId_studentId: {
          projectId: project.id,
          studentId: student.id,
        },
      },
      update: {
        status: application.status,
        motivation: application.motivation,
        reviewedById: reviewedBy?.id ?? null,
        reviewedAt: reviewedBy ? new Date("2026-05-10T10:00:00.000Z") : null,
      },
      create: {
        projectId: project.id,
        studentId: student.id,
        status: application.status,
        motivation: application.motivation,
        reviewedById: reviewedBy?.id ?? null,
        reviewedAt: reviewedBy ? new Date("2026-05-10T10:00:00.000Z") : null,
      },
    });
  }

  const membershipMap = new Map<string, MembershipRecord>();
  for (const membership of memberships) {
    const project = projectMap.get(membership.projectKey);
    const student = studentMap.get(membership.studentEmail);
    const assignedBy = userMap.get(membership.assignedByEmail);

    if (!project || !student) {
      throw new Error(`Missing membership relation for ${membership.projectKey}/${membership.studentEmail}`);
    }

    const record = await prisma.projectMembership.upsert({
      where: {
        projectId_studentId: {
          projectId: project.id,
          studentId: student.id,
        },
      },
      update: {
        assignedById: assignedBy?.id ?? null,
        roleLabel: membership.roleLabel,
        isActive: true,
        endedAt: null,
      },
      create: {
        projectId: project.id,
        studentId: student.id,
        assignedById: assignedBy?.id ?? null,
        roleLabel: membership.roleLabel,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    membershipMap.set(`${membership.projectKey}:${membership.studentEmail}`, {
      id: record.id,
      projectKey: membership.projectKey,
      studentEmail: membership.studentEmail,
    });
  }

  const taskMap = new Map<string, TaskRecord>();
  for (const task of projectTasks) {
    const project = projectMap.get(task.projectKey);
    const membership = membershipMap.get(`${task.projectKey}:${task.studentEmail}`);
    const createdBy = task.createdByEmail ? userMap.get(task.createdByEmail) : null;

    if (!project) {
      throw new Error(`Missing project for task ${task.title}`);
    }

    const record = await upsertTask({
      projectId: project.id,
      membershipId: membership?.id ?? null,
      createdById: createdBy?.id ?? null,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: new Date(task.dueDate),
      completedAt: dateOrNull("completedAt" in task ? task.completedAt : undefined),
    });

    taskMap.set(`${task.projectKey}:${task.title}`, {
      id: record.id,
      projectKey: task.projectKey,
      title: record.title,
    });
  }

  const deliverableMap = new Map<string, DeliverableRecord>();
  for (const deliverable of deliverables) {
    const project = projectMap.get(deliverable.projectKey);
    const membership = membershipMap.get(`${deliverable.projectKey}:${deliverable.studentEmail}`);
    const task = taskMap.get(`${deliverable.projectKey}:${deliverable.taskTitle}`);
    const reviewedBy = deliverable.reviewedByEmail
      ? userMap.get(deliverable.reviewedByEmail)
      : null;

    if (!project) {
      throw new Error(`Missing project for deliverable ${deliverable.title}`);
    }

    const record = await upsertDeliverable({
      projectId: project.id,
      membershipId: membership?.id ?? null,
      taskId: task?.id ?? null,
      reviewedById: reviewedBy?.id ?? null,
      title: deliverable.title,
      description: deliverable.description,
      submissionUrl: deliverable.submissionUrl,
      repositoryUrl: deliverable.repositoryUrl,
      status: deliverable.status,
      submittedAt: dateOrNull(deliverable.submittedAt),
      reviewedAt: dateOrNull(deliverable.reviewedAt),
    });

    deliverableMap.set(deliverable.title, {
      id: record.id,
      title: record.title,
    });
  }

  const feedbackMap = new Map<string, FeedbackRecord>();
  for (const feedback of feedbacks) {
    const project = feedback.projectKey ? projectMap.get(feedback.projectKey) : null;
    const student = studentMap.get(feedback.studentEmail);
    const membership = feedback.membershipStudentEmail
      ? membershipMap.get(`${feedback.projectKey}:${feedback.membershipStudentEmail}`)
      : null;
    const deliverable = feedback.deliverableTitle
      ? deliverableMap.get(feedback.deliverableTitle)
      : null;
    const author = feedback.authorEmail ? userMap.get(feedback.authorEmail) : null;

    if (!student) {
      throw new Error(`Missing student for feedback ${getFeedbackKey(feedback)}`);
    }

    const record = await upsertFeedback({
      studentId: student.id,
      projectId: project?.id ?? null,
      membershipId: membership?.id ?? null,
      deliverableId: deliverable?.id ?? null,
      authorId: author?.id ?? null,
      source: feedback.source,
      title: feedback.title,
      comment: feedback.comment,
      rating: feedback.rating,
    });

    feedbackMap.set(getFeedbackKey(feedback), {
      id: record.id,
      title: record.title,
    });
  }

  for (const score of technicalScores) {
    const student = studentMap.get(score.studentEmail);
    const project = score.projectKey ? projectMap.get(score.projectKey) : null;
    const feedback = score.feedbackTitle ? feedbackMap.get(score.feedbackTitle) : null;
    const evaluator = score.evaluatorEmail ? userMap.get(score.evaluatorEmail) : null;

    if (!student) {
      throw new Error(`Missing student for technical score ${score.category}`);
    }

    await upsertTechnicalScore({
      studentId: student.id,
      projectId: project?.id ?? null,
      feedbackId: feedback?.id ?? null,
      evaluatorId: evaluator?.id ?? null,
      category: score.category,
      score: score.score,
      maxScore: score.maxScore,
      notes: score.notes,
    });
  }

  for (const score of maturityScores) {
    const student = studentMap.get(score.studentEmail);
    const project = score.projectKey ? projectMap.get(score.projectKey) : null;
    const feedback = score.feedbackTitle ? feedbackMap.get(score.feedbackTitle) : null;
    const evaluator = score.evaluatorEmail ? userMap.get(score.evaluatorEmail) : null;

    if (!student) {
      throw new Error(`Missing student for maturity score ${score.dimension}`);
    }

    await upsertMaturityScore({
      studentId: student.id,
      projectId: project?.id ?? null,
      feedbackId: feedback?.id ?? null,
      evaluatorId: evaluator?.id ?? null,
      dimension: score.dimension,
      score: score.score,
      maxScore: score.maxScore,
      notes: score.notes,
    });
  }

  for (const certificate of certificates) {
    const student = studentMap.get(certificate.studentEmail);
    const project = certificate.projectKey ? projectMap.get(certificate.projectKey) : null;
    const membership = certificate.membershipStudentEmail
      ? membershipMap.get(`${certificate.projectKey}:${certificate.membershipStudentEmail}`)
      : null;
    const issuedBy = certificate.issuedByEmail ? userMap.get(certificate.issuedByEmail) : null;
    const seededStudent = seedUsers.students.find(
      (entry) => entry.email === certificate.studentEmail,
    );
    const seededProject = certificate.projectKey
      ? seedProjects.find((entry) => entry.key === certificate.projectKey)
      : null;
    const seededSupervisor = seededProject
      ? seedUsers.supervisors.find(
          (entry) => entry.email === seededProject.supervisorEmail,
        )
      : null;

    if (!student || !seededStudent) {
      throw new Error(`Missing student for certificate ${certificate.referenceCode}`);
    }

    const studentName = `${seededStudent.firstName} ${seededStudent.lastName}`;
    const supervisorName = seededSupervisor
      ? `${seededSupervisor.firstName} ${seededSupervisor.lastName}`
      : null;
    const skillsSnapshot = seededStudent.skillsSummary
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    await prisma.certificate.upsert({
      where: { referenceCode: certificate.referenceCode },
      update: {
        studentId: student.id,
        projectId: project?.id ?? null,
        membershipId: membership?.id ?? null,
        issuedById: issuedBy?.id ?? null,
        status: certificate.status,
        title: certificate.title,
        verificationCode: certificate.verificationCode,
        summary: certificate.summary,
        studentNameSnapshot: studentName,
        projectTitleSnapshot: project?.title ?? null,
        supervisorNameSnapshot: supervisorName,
        levelSnapshot: seededStudent.level,
        skillsSnapshot,
        issuedAt: dateOrNull(certificate.issuedAt),
      },
      create: {
        referenceCode: certificate.referenceCode,
        verificationCode: certificate.verificationCode,
        studentId: student.id,
        projectId: project?.id ?? null,
        membershipId: membership?.id ?? null,
        issuedById: issuedBy?.id ?? null,
        status: certificate.status,
        title: certificate.title,
        summary: certificate.summary,
        studentNameSnapshot: studentName,
        projectTitleSnapshot: project?.title ?? null,
        supervisorNameSnapshot: supervisorName,
        levelSnapshot: seededStudent.level,
        skillsSnapshot,
        issuedAt: dateOrNull(certificate.issuedAt),
      },
    });
  }

  for (const item of portfolioItems) {
    const student = studentMap.get(item.studentEmail);
    const project = item.projectKey ? projectMap.get(item.projectKey) : null;

    if (!student) {
      throw new Error(`Missing student for portfolio item ${item.title}`);
    }

    await upsertPortfolioItem({
      studentId: student.id,
      projectId: project?.id ?? null,
      title: item.title,
      summary: item.summary,
      description: item.description,
      demoUrl: item.demoUrl,
      repositoryUrl: item.repositoryUrl,
      isPublished: item.isPublished,
      sortOrder: item.sortOrder,
    });
  }

  const summary = {
    admins: 1,
    supervisors: seedUsers.supervisors.length,
    companies: seedUsers.companies.length,
    students: seedUsers.students.length,
    projects: seedProjects.length,
    applications: projectApplications.length,
    memberships: memberships.length,
    tasks: projectTasks.length,
    deliverables: deliverables.length,
    feedbacks: feedbacks.length,
    technicalScores: technicalScores.length,
    maturityScores: maturityScores.length,
    certificates: certificates.length,
    portfolioItems: portfolioItems.length,
  };

  console.log("Seed complete", summary);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
