-- Previous migration created expenses.approvalStatus as TEXT while Prisma expects ApprovalStatus enum.
-- Cast safely so Prisma enum comparisons work in Approval Center.
UPDATE "expenses"
SET "approvalStatus" = 'pending'
WHERE "approvalStatus" NOT IN ('pending', 'approved', 'rejected', 'revision_requested');

ALTER TABLE "expenses"
ALTER COLUMN "approvalStatus" DROP DEFAULT,
ALTER COLUMN "approvalStatus" TYPE "ApprovalStatus" USING "approvalStatus"::"ApprovalStatus",
ALTER COLUMN "approvalStatus" SET DEFAULT 'pending';
