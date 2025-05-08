-- DropForeignKey
ALTER TABLE "note" DROP CONSTRAINT "note_send_to_id_fkey";

-- AlterTable
ALTER TABLE "note" ALTER COLUMN "send_to_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_send_to_id_fkey" FOREIGN KEY ("send_to_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
