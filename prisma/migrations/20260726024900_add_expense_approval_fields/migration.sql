-- AlterTable
ALTER TABLE "expenses" 
ADD COLUMN "shipmentId" TEXT,
ADD COLUMN "expenseDate" TIMESTAMP(3),
ADD COLUMN "receiptUrl" TEXT,
ADD COLUMN "ocrData" JSONB,
ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "approvalComment" TEXT;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
