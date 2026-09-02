ALTER TABLE "calculation_histories"
  ADD COLUMN IF NOT EXISTS "calculationType" TEXT NOT NULL DEFAULT 'standard_index',
  ADD COLUMN IF NOT EXISTS "baseIndexes" JSONB,
  ADD COLUMN IF NOT EXISTS "baseIndexWeights" JSONB,
  ADD COLUMN IF NOT EXISTS "marketPriceSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "baseGar" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "targetGar" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "targetProrataMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "priceAfterProrata" DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS "basis" TEXT,
  ADD COLUMN IF NOT EXISTS "basisAdjustment" DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS "basisDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "priceAfterBasis" DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS "tsAdjustment" DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS "ashAdjustment" DECIMAL(10,4);

ALTER TABLE "forecast_projects"
  ADD COLUMN IF NOT EXISTS "calculationHistoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "calculatorSnapshot" JSONB;

CREATE INDEX IF NOT EXISTS "calculation_histories_calculationType_createdAt_idx" ON "calculation_histories"("calculationType", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "forecast_projects_calculationHistoryId_idx" ON "forecast_projects"("calculationHistoryId");
DO $$ BEGIN
  ALTER TABLE "forecast_projects" ADD CONSTRAINT "forecast_projects_calculationHistoryId_fkey" FOREIGN KEY ("calculationHistoryId") REFERENCES "calculation_histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
