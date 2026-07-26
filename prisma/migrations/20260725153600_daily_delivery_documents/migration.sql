-- CreateTable
CREATE TABLE "daily_delivery_documents" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "daily_delivery_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_delivery_documents_deliveryId_idx" ON "daily_delivery_documents"("deliveryId");

-- CreateIndex
CREATE INDEX "daily_delivery_documents_documentType_idx" ON "daily_delivery_documents"("documentType");

-- AddForeignKey
ALTER TABLE "daily_delivery_documents" ADD CONSTRAINT "daily_delivery_documents_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "daily_delivery_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
