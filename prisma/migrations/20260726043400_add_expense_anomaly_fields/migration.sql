-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "isAnomaly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expenses" ADD COLUMN "anomalyReason" TEXT;
