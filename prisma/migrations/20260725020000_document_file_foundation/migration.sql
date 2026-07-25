CREATE TABLE IF NOT EXISTS "document_files" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "sourceModule" TEXT NOT NULL DEFAULT 'shipment',
  "sourceEntityId" TEXT,
  "title" TEXT,
  "originalName" TEXT,
  "mimeType" TEXT,
  "size" INTEGER,
  "provider" TEXT NOT NULL DEFAULT 'external_url',
  "bucket" TEXT,
  "objectKey" TEXT,
  "publicUrl" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'internal',
  "version" INTEGER NOT NULL DEFAULT 1,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "uploadedBy" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "document_files_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_files_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "shipment_documents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "document_files_requirementId_idx" ON "document_files"("requirementId");
CREATE INDEX IF NOT EXISTS "document_files_sourceModule_sourceEntityId_idx" ON "document_files"("sourceModule", "sourceEntityId");
CREATE INDEX IF NOT EXISTS "document_files_visibility_idx" ON "document_files"("visibility");
CREATE INDEX IF NOT EXISTS "document_files_uploadedAt_idx" ON "document_files"("uploadedAt" DESC);

INSERT INTO "document_files" (
  "id", "requirementId", "sourceModule", "sourceEntityId", "title",
  "originalName", "size", "provider", "publicUrl", "visibility",
  "version", "uploadedBy", "uploadedAt"
)
SELECT
  sd."id" || '_legacy_1',
  sd."id",
  'shipment',
  sd."shipmentId",
  sd."label",
  sd."fileName",
  sd."fileSize",
  'legacy_url',
  sd."fileUrl",
  'internal',
  1,
  sd."uploadedBy",
  COALESCE(sd."uploadedAt", CURRENT_TIMESTAMP)
FROM "shipment_documents" sd
WHERE sd."fileUrl" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "document_files" df
    WHERE df."requirementId" = sd."id"
      AND df."publicUrl" = sd."fileUrl"
      AND df."isDeleted" = false
  );
