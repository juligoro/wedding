-- CreateTable
CREATE TABLE "Rsvp" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
