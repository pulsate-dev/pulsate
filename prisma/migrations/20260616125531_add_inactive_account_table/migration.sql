-- DropForeignKey
ALTER TABLE "account_verify_token" DROP CONSTRAINT "account_verify_token_account_id_fkey";

-- CreateTable
CREATE TABLE "inactive_account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "passphrase_hash" TEXT NOT NULL,
    "role" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inactive_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inactive_account_name_key" ON "inactive_account"("name");

-- CreateIndex
CREATE UNIQUE INDEX "inactive_account_mail_key" ON "inactive_account"("mail");

-- AddForeignKey
ALTER TABLE "account_verify_token" ADD CONSTRAINT "account_verify_token_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "inactive_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
