DO $$ BEGIN
  CREATE TYPE "ShipmentClass" AS ENUM ('mother_vessel', 'child_nomination');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "shipments"
  ADD COLUMN IF NOT EXISTS "shipmentClass" "ShipmentClass" NOT NULL DEFAULT 'mother_vessel';
