ALTER TABLE "fco_records"
  ADD COLUMN IF NOT EXISTS "templateProfile" TEXT,
  ADD COLUMN IF NOT EXISTS "templateFile" TEXT;
