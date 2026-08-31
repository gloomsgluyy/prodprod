CREATE TABLE "calculation_histories" (
    "id" TEXT NOT NULL,
    "baseIndex" TEXT NOT NULL,
    "baseIndexDate" DATE NOT NULL,
    "baseIndexValue" DECIMAL(10,4) NOT NULL,
    "prorataMethod" TEXT NOT NULL,
    "actualTs" DECIMAL(10,4),
    "contractTs" DECIMAL(10,4),
    "actualAsh" DECIMAL(10,4),
    "contractAsh" DECIMAL(10,4),
    "qualityAdjustment" DECIMAL(10,4) NOT NULL,
    "premiumDiscount" DECIMAL(10,4) NOT NULL,
    "description" TEXT,
    "finalPrice" DECIMAL(10,4) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calculation_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "calculation_histories_createdById_createdAt_idx" ON "calculation_histories"("createdById", "createdAt" DESC);
CREATE INDEX "calculation_histories_createdAt_idx" ON "calculation_histories"("createdAt" DESC);
ALTER TABLE "calculation_histories" ADD CONSTRAINT "calculation_histories_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
