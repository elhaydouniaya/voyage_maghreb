-- Overbooking prevention: reserved seats + booking expiry
ALTER TABLE "GroupTrip" ADD COLUMN IF NOT EXISTS "reservedSpots" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- External agency reviews (admin validation)
CREATE TYPE "ExternalReviewPlatform" AS ENUM ('GOOGLE', 'TRIPADVISOR', 'FACEBOOK', 'TRUSTPILOT', 'VIATOR');

CREATE TABLE IF NOT EXISTS "ExternalReview" (
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

CREATE INDEX IF NOT EXISTS "ExternalReview_agencyId_idx" ON "ExternalReview"("agencyId");

ALTER TABLE "ExternalReview" DROP CONSTRAINT IF EXISTS "ExternalReview_agencyId_fkey";
ALTER TABLE "ExternalReview" ADD CONSTRAINT "ExternalReview_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
