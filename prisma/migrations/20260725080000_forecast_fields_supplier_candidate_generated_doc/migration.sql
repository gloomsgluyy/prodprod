-- Migration: EXEC-053 Forecast full field set, ForecastSupplierCandidate, GeneratedDocument
-- Date: 2026-07-25

-- ── ForecastProject new fields ─────────────────────────────────────────────────
ALTER TABLE "forecast_projects"
  ADD COLUMN IF NOT EXISTS "forecastMonth"   TEXT,
  ADD COLUMN IF NOT EXISTS "commodity"       TEXT,
  ADD COLUMN IF NOT EXISTS "priceBasis"      TEXT,
  ADD COLUMN IF NOT EXISTS "paymentTerm"     TEXT,
  ADD COLUMN IF NOT EXISTS "surveyor"        TEXT,
  ADD COLUMN IF NOT EXISTS "specNar"         DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "specIm"          DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS "specVm"          DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS "specHgi"         DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS "specSize"        TEXT,
  ADD COLUMN IF NOT EXISTS "marketSnapshot"  JSONB;

-- ── ForecastSupplierCandidate ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "forecast_supplier_candidates" (
  "id"                    TEXT NOT NULL,
  "forecastProjectId"     TEXT NOT NULL,
  "sourceId"              TEXT,
  "supplierName"          TEXT NOT NULL,
  "origin"                TEXT,
  "stockMt"               DECIMAL(12, 2),
  "priceUsd"              DECIMAL(10, 4),
  "readinessStatus"       TEXT,
  "legalStatus"           TEXT,
  "gar"                   DECIMAL(10, 2),
  "nar"                   DECIMAL(10, 2),
  "tm"                    DECIMAL(6, 2),
  "im"                    DECIMAL(6, 2),
  "ts"                    DECIMAL(6, 3),
  "ash"                   DECIMAL(6, 2),
  "vm"                    DECIMAL(6, 2),
  "hgi"                   DECIMAL(6, 2),
  "size"                  TEXT,
  "fitScore"              DECIMAL(5, 2),
  "belowSpecFlags"        JSONB,
  "belowSpecAcknowledged" BOOLEAN NOT NULL DEFAULT false,
  "belowSpecReason"       TEXT,
  "selected"              BOOLEAN NOT NULL DEFAULT false,
  "notes"                 TEXT,
  "createdById"           TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "forecast_supplier_candidates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "forecast_supplier_candidates_forecastProjectId_fkey"
    FOREIGN KEY ("forecastProjectId") REFERENCES "forecast_projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "forecast_supplier_candidates_forecastProjectId_idx"
  ON "forecast_supplier_candidates"("forecastProjectId");

-- ── GeneratedDocument ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "generated_documents" (
  "id"                TEXT NOT NULL,
  "type"              TEXT NOT NULL,
  "sourceModule"      TEXT NOT NULL DEFAULT 'shipment',
  "sourceEntityId"    TEXT,
  "shipmentId"        TEXT,
  "forecastProjectId" TEXT,
  "number"            TEXT,
  "version"           INTEGER NOT NULL DEFAULT 1,
  "title"             TEXT NOT NULL,
  "pdfUrl"            TEXT,
  "storageProvider"   TEXT,
  "objectKey"         TEXT,
  "visibility"        TEXT NOT NULL DEFAULT 'internal',
  "generatedById"     TEXT,
  "generatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status"            TEXT NOT NULL DEFAULT 'generated',
  "metadata"          JSONB,
  CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "generated_documents_type_sourceEntityId_idx"
  ON "generated_documents"("type", "sourceEntityId");
CREATE INDEX IF NOT EXISTS "generated_documents_shipmentId_idx"
  ON "generated_documents"("shipmentId");
CREATE INDEX IF NOT EXISTS "generated_documents_forecastProjectId_idx"
  ON "generated_documents"("forecastProjectId");
CREATE INDEX IF NOT EXISTS "generated_documents_generatedAt_idx"
  ON "generated_documents"("generatedAt" DESC);
