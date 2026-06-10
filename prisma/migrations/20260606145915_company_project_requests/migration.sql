-- CreateEnum
CREATE TYPE "CompanyProjectRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CONVERTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_REQUEST_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_REQUEST_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_REQUEST_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_REQUEST_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_REQUEST_CONVERTED';

-- CreateTable
CREATE TABLE "CompanyProjectRequest" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "desiredLevel" "StudentLevel" NOT NULL,
    "expectedTeamSize" INTEGER NOT NULL,
    "estimatedDuration" TEXT NOT NULL,
    "specBookUrl" TEXT NOT NULL,
    "status" "CompanyProjectRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "adminReviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "convertedProjectId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyProjectRequest_companyId_status_idx" ON "CompanyProjectRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "CompanyProjectRequest_status_createdAt_idx" ON "CompanyProjectRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyProjectRequest_convertedProjectId_idx" ON "CompanyProjectRequest"("convertedProjectId");

-- CreateIndex
CREATE INDEX "CompanyProjectRequest_createdAt_idx" ON "CompanyProjectRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "CompanyProjectRequest" ADD CONSTRAINT "CompanyProjectRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProjectRequest" ADD CONSTRAINT "CompanyProjectRequest_convertedProjectId_fkey" FOREIGN KEY ("convertedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
