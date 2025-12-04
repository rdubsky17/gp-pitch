/*
  Warnings:

  - You are about to alter the column `isUserUpload` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "songName" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "isUserUpload" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Track_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("artist", "filePath", "id", "isUserUpload", "songName", "uploadedAt", "uploadedBy") SELECT "artist", "filePath", "id", "isUserUpload", "songName", "uploadedAt", "uploadedBy" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
