-- DropForeignKey
ALTER TABLE "note" DROP CONSTRAINT "note_send_to_id_fkey";

-- AlterTable
ALTER TABLE "note" DROP COLUMN "send_to_id";

-- CreateTable
CREATE TABLE "direct_note" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "direct_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_note_attachment" (
    "medium_id" TEXT NOT NULL,
    "direct_note_id" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "direct_note_attachment_pkey" PRIMARY KEY ("medium_id","direct_note_id")
);

-- CreateTable
CREATE TABLE "direct_note_reaction" (
    "reactionId" TEXT NOT NULL,
    "reacted_by_id" TEXT NOT NULL,
    "reacted_to_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "direct_note_reaction_pkey" PRIMARY KEY ("reactionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "direct_note_reaction_reacted_by_id_reacted_to_id_key" ON "direct_note_reaction"("reacted_by_id", "reacted_to_id");

-- AddForeignKey
ALTER TABLE "direct_note" ADD CONSTRAINT "direct_note_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_note" ADD CONSTRAINT "direct_note_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_note_attachment" ADD CONSTRAINT "direct_note_attachment_medium_id_fkey" FOREIGN KEY ("medium_id") REFERENCES "medium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_note_attachment" ADD CONSTRAINT "direct_note_attachment_direct_note_id_fkey" FOREIGN KEY ("direct_note_id") REFERENCES "direct_note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_note_reaction" ADD CONSTRAINT "direct_note_reaction_reacted_by_id_fkey" FOREIGN KEY ("reacted_by_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_note_reaction" ADD CONSTRAINT "direct_note_reaction_reacted_to_id_fkey" FOREIGN KEY ("reacted_to_id") REFERENCES "direct_note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
