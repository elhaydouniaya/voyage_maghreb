-- Stripe Connect (Express) pour versements agence
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "stripeConnectOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "Agency_stripeConnectAccountId_key" ON "Agency"("stripeConnectAccountId");
