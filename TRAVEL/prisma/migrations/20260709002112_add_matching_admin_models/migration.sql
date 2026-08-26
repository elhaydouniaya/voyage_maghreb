-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'OTHER');

-- CreateEnum
CREATE TYPE "ExternalReviewPlatform" AS ENUM ('GOOGLE', 'TRIPADVISOR', 'FACEBOOK', 'TRUSTPILOT', 'VIATOR');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "RequestStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "RequestStatus" ADD VALUE 'AGENCY_ACCEPTED';
ALTER TYPE "RequestStatus" ADD VALUE 'OFFER_RECEIVED';
ALTER TYPE "RequestStatus" ADD VALUE 'CLIENT_VIEWED';
ALTER TYPE "RequestStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GroupTrip" ADD COLUMN     "reservedSpots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "season" "Season" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "TravelRequestAgencyAssignment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL DEFAULT 'suggested',
    "matchScore" INTEGER,
    "matchReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedByUserId" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRequestAgencyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalReview" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "platform" "ExternalReviewPlatform" NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "location" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelRequestAgencyAssignment_requestId_idx" ON "TravelRequestAgencyAssignment"("requestId");

-- CreateIndex
CREATE INDEX "TravelRequestAgencyAssignment_agencyId_idx" ON "TravelRequestAgencyAssignment"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "TravelRequestAgencyAssignment_requestId_agencyId_key" ON "TravelRequestAgencyAssignment"("requestId", "agencyId");

-- CreateIndex
CREATE INDEX "TravelRequestStatusHistory_requestId_idx" ON "TravelRequestStatusHistory"("requestId");

-- CreateIndex
CREATE INDEX "TravelRequestStatusHistory_createdAt_idx" ON "TravelRequestStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNote_requestId_idx" ON "AdminNote"("requestId");

-- CreateIndex
CREATE INDEX "AdminNote_createdByUserId_idx" ON "AdminNote"("createdByUserId");

-- CreateIndex
CREATE INDEX "ExternalReview_agencyId_idx" ON "ExternalReview"("agencyId");

-- AddForeignKey
ALTER TABLE "TravelRequestAgencyAssignment" ADD CONSTRAINT "TravelRequestAgencyAssignment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequestAgencyAssignment" ADD CONSTRAINT "TravelRequestAgencyAssignment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequestStatusHistory" ADD CONSTRAINT "TravelRequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalReview" ADD CONSTRAINT "ExternalReview_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
