/*
  Warnings:

  - A unique constraint covering the columns `[account_id]` on the table `account_avatar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[account_id]` on the table `account_header` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "account_avatar_account_id_key" ON "account_avatar"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_header_account_id_key" ON "account_header"("account_id");
