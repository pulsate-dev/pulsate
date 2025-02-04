/*
  Warnings:

  - A unique constraint covering the columns `[reacted_by_id,reacted_to_id]` on the table `reaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reaction_reacted_by_id_reacted_to_id_key" ON "reaction"("reacted_by_id", "reacted_to_id");
