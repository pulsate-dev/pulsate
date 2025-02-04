/*
  Warnings:

  - The primary key for the `reaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `reactionId` to the `reaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reaction" DROP CONSTRAINT "reaction_pkey",
ADD COLUMN     "reactionId" TEXT NOT NULL,
ADD CONSTRAINT "reaction_pkey" PRIMARY KEY ("reactionId");
