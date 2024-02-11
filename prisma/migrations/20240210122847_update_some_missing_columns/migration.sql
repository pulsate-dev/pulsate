/*
  Warnings:

  - The primary key for the `account_verify_token` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[mail]` on the table `account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "account_verify_token" DROP CONSTRAINT "account_verify_token_pkey",
ADD CONSTRAINT "account_verify_token_pkey" PRIMARY KEY ("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_mail_key" ON "account"("mail");
