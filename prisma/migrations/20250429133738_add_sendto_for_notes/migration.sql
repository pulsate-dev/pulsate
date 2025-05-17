/*
  Warnings:

  - Added the required column `send_to_id` to the `note` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "note" ADD COLUMN     "send_to_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_send_to_id_fkey" FOREIGN KEY ("send_to_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
