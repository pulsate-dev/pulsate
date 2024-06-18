/*
  Warnings:

  - Added the required column `hash` to the `medium` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nsfw` to the `medium` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnailUrl` to the `medium` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "medium" ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "nsfw" BOOLEAN NOT NULL,
ADD COLUMN     "thumbnailUrl" TEXT NOT NULL;
