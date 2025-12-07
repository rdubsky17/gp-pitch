/*
  Warnings:

  - You are about to drop the column `duration` on the `Score` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instrument" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Score_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Score" ("createdAt", "hits", "id", "instrument", "total", "trackId", "userId", "value") SELECT "createdAt", "hits", "id", "instrument", "total", "trackId", "userId", "value" FROM "Score";
DROP TABLE "Score";
ALTER TABLE "new_Score" RENAME TO "Score";
CREATE INDEX "Score_userId_trackId_idx" ON "Score"("userId", "trackId");
CREATE INDEX "Score_trackId_value_idx" ON "Score"("trackId", "value");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
