-- CreateTable
CREATE TABLE "Invitee" (
  "id" SERIAL NOT NULL,
  "fullName" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "household" TEXT,
  "email" TEXT,
  "whatsapp" TEXT,
  "party" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  "contacted" BOOLEAN NOT NULL DEFAULT false,
  "manualGuestId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Invitee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invitee_normalized_idx" ON "Invitee"("normalized");
