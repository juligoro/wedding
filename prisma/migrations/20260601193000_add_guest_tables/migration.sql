-- CreateTable
CREATE TABLE "SeatingTable" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 10,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Guest" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Guest_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "Rsvp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Guest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "SeatingTable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SeatingTable_name_key" ON "SeatingTable"("name");

-- CreateIndex
CREATE INDEX "Guest_rsvpId_idx" ON "Guest"("rsvpId");

-- CreateIndex
CREATE INDEX "Guest_tableId_idx" ON "Guest"("tableId");
