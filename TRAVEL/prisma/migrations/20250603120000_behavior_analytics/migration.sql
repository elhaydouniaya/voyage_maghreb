-- CreateEnum
CREATE TYPE "JourneyStep" AS ENUM ('PAGE_VIEW', 'SEARCH_START', 'AI_MATCH_SUBMIT', 'TRIP_VIEW', 'CHECKOUT_START', 'BOOKING_CONFIRMED', 'LOGIN', 'REGISTER', 'GUIDE_CHAT');

-- CreateTable
CREATE TABLE "BehaviorEvent" (
    "id" TEXT NOT NULL,
    "step" "JourneyStep" NOT NULL,
    "path" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "role" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BehaviorEvent_step_createdAt_idx" ON "BehaviorEvent"("step", "createdAt");

-- CreateIndex
CREATE INDEX "BehaviorEvent_sessionId_createdAt_idx" ON "BehaviorEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "BehaviorEvent_userId_createdAt_idx" ON "BehaviorEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BehaviorEvent" ADD CONSTRAINT "BehaviorEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
