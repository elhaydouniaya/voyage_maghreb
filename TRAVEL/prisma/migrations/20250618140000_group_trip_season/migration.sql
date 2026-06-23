-- Season column for GroupTrip (sorting / homepage carousel)
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'OTHER');

ALTER TABLE "GroupTrip" ADD COLUMN IF NOT EXISTS "season" "Season" NOT NULL DEFAULT 'OTHER';

-- Backfill from startDate month
UPDATE "GroupTrip"
SET "season" = CASE
  WHEN EXTRACT(MONTH FROM "startDate") BETWEEN 3 AND 5 THEN 'SPRING'::"Season"
  WHEN EXTRACT(MONTH FROM "startDate") BETWEEN 6 AND 8 THEN 'SUMMER'::"Season"
  WHEN EXTRACT(MONTH FROM "startDate") BETWEEN 9 AND 11 THEN 'AUTUMN'::"Season"
  WHEN EXTRACT(MONTH FROM "startDate") IN (12, 1, 2) THEN 'WINTER'::"Season"
  ELSE 'OTHER'::"Season"
END
WHERE "season" = 'OTHER';
