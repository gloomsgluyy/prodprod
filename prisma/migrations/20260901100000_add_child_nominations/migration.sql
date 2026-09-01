CREATE TABLE "child_nominations" (
  "id" TEXT NOT NULL,
  "motherShipmentId" TEXT NOT NULL,
  "nominationNumber" TEXT NOT NULL,
  "bargeName" TEXT NOT NULL,
  "plannedQty" DECIMAL(12,2),
  "loadedQty" DECIMAL(12,2),
  "finalQty" DECIMAL(12,2),
  "source" TEXT,
  "supplier" TEXT,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "currentStage" TEXT,
  "eta" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "child_nominations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "child_nominations_nominationNumber_key" ON "child_nominations"("nominationNumber");
CREATE INDEX "child_nominations_motherShipmentId_idx" ON "child_nominations"("motherShipmentId");
CREATE INDEX "child_nominations_status_idx" ON "child_nominations"("status");
ALTER TABLE "child_nominations" ADD CONSTRAINT "child_nominations_motherShipmentId_fkey" FOREIGN KEY ("motherShipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "child_nominations" ADD CONSTRAINT "child_nominations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
