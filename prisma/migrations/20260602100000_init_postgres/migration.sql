-- CreateTable
CREATE TABLE "Rsvp" (
  "id" SERIAL NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "attending" BOOLEAN NOT NULL,
  "companionCount" INTEGER NOT NULL DEFAULT 0,
  "companions" TEXT NOT NULL DEFAULT '[]',
  "primaryFood" TEXT,
  "companionFood" TEXT NOT NULL DEFAULT '[]',
  "allergies" TEXT,
  "needsBus" BOOLEAN,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingTable" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeatingTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
  "id" SERIAL NOT NULL,
  "rsvpId" INTEGER NOT NULL,
  "tableId" INTEGER,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "fullName" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "attending" BOOLEAN NOT NULL DEFAULT true,
  "food" TEXT,
  "allergies" TEXT,
  "needsBus" BOOLEAN,
  "email" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "tags" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeatingTable_name_key" ON "SeatingTable"("name");

-- CreateIndex
CREATE INDEX "Guest_rsvpId_idx" ON "Guest"("rsvpId");

-- CreateIndex
CREATE INDEX "Guest_tableId_idx" ON "Guest"("tableId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "Rsvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "SeatingTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
