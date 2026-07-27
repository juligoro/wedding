-- AlterTable: reversible archive (soft delete) for households on Invitee
ALTER TABLE "Invitee" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invitee_deletedAt_idx" ON "Invitee"("deletedAt");
