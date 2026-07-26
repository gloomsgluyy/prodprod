-- AlterTable
ALTER TABLE "forecast_projects" 
ADD COLUMN "buyerFeedbackStatus" TEXT,
ADD COLUMN "buyerFeedbackReason" TEXT,
ADD COLUMN "buyerFeedbackUpdatedAt" TIMESTAMP(3),
ADD COLUMN "buyerFeedbackHistory" JSONB;

-- Comment: Buyer feedback workflow for FCO tracking
-- fco_sent -> waiting_feedback -> negotiation -> deal | failed
