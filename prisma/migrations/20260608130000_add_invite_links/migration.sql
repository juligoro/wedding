-- AlterTable: per-household invite link fields on Invitee
ALTER TABLE "Invitee" ADD COLUMN "token" TEXT;
ALTER TABLE "Invitee" ADD COLUMN "greeting" TEXT;
ALTER TABLE "Invitee" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'es';
ALTER TABLE "Invitee" ADD COLUMN "members" TEXT NOT NULL DEFAULT '[]';

-- Backfill: give every existing invitee an unguessable token before NOT NULL.
-- random() + id is evaluated per row, so each token is distinct.
UPDATE "Invitee" SET "token" = substr(md5(random()::text || ':' || "id"::text), 1, 12) WHERE "token" IS NULL;

ALTER TABLE "Invitee" ALTER COLUMN "token" SET NOT NULL;

-- AlterTable: link each RSVP back to the household that was invited
ALTER TABLE "Rsvp" ADD COLUMN "inviteeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Invitee_token_key" ON "Invitee"("token");

-- CreateIndex
CREATE INDEX "Rsvp_inviteeId_idx" ON "Rsvp"("inviteeId");

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Invitee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
