-- AlterTable
ALTER TABLE "Rsvp" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Rsvp_deletedAt_idx" ON "Rsvp"("deletedAt");

-- CreateIndex
CREATE INDEX "Guest_deletedAt_idx" ON "Guest"("deletedAt");
