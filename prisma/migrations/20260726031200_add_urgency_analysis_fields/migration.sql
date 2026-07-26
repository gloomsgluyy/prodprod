-- AlterTable
ALTER TABLE "forecast_projects"
ADD COLUMN "urgencyScore" INTEGER,
ADD COLUMN "urgencyLevel" TEXT,
ADD COLUMN "urgencyReport" JSONB,
ADD COLUMN "lastUrgencyAnalyzedAt" TIMESTAMP(3),
ADD COLUMN "requiredDocuments" JSONB;

-- AlterTable
ALTER TABLE "deals"
ADD COLUMN "forecastProjectId" TEXT;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_forecastProjectId_fkey" FOREIGN KEY ("forecastProjectId") REFERENCES "forecast_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
