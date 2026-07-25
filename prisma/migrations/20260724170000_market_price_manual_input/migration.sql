ALTER TABLE "market_prices"
  ADD COLUMN IF NOT EXISTS "mgoUsd" DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS "usdIdr" DECIMAL(15, 4),
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "market_prices" ALTER COLUMN "updatedBy" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'market_prices'
      AND column_name = 'fxRateIdr'
  ) THEN
    EXECUTE 'UPDATE "market_prices" SET "usdIdr" = "fxRateIdr" WHERE "usdIdr" IS NULL AND "fxRateIdr" IS NOT NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "market_prices_createdAt_idx" ON "market_prices" ("createdAt" DESC);
