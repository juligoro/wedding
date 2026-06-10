-- AlterTable: invite-link open tracking + reminder bookkeeping on Invitee
ALTER TABLE "Invitee" ADD COLUMN "firstOpenedAt" TIMESTAMP(3);
ALTER TABLE "Invitee" ADD COLUMN "lastOpenedAt" TIMESTAMP(3);
ALTER TABLE "Invitee" ADD COLUMN "openCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invitee" ADD COLUMN "lastRemindedAt" TIMESTAMP(3);
ALTER TABLE "Invitee" ADD COLUMN "remindCount" INTEGER NOT NULL DEFAULT 0;
