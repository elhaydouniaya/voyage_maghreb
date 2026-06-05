-- CreateTable
CREATE TABLE "AgencyLead" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "travelRequestId" TEXT NOT NULL,
    "matchedTripIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bestCompatibility" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyLead_agencyId_createdAt_idx" ON "AgencyLead"("agencyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyLead_agencyId_travelRequestId_key" ON "AgencyLead"("agencyId", "travelRequestId");

-- AddForeignKey
ALTER TABLE "AgencyLead" ADD CONSTRAINT "AgencyLead_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLead" ADD CONSTRAINT "AgencyLead_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
