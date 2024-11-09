-- CreateTable
CREATE TABLE "account_avatar" (
    "account_id" TEXT NOT NULL,
    "medium_id" TEXT NOT NULL,

    CONSTRAINT "account_avatar_pkey" PRIMARY KEY ("account_id","medium_id")
);

-- CreateTable
CREATE TABLE "account_header" (
    "account_id" TEXT NOT NULL,
    "medium_id" TEXT NOT NULL,

    CONSTRAINT "account_header_pkey" PRIMARY KEY ("account_id","medium_id")
);

-- AddForeignKey
ALTER TABLE "account_avatar" ADD CONSTRAINT "account_avatar_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_avatar" ADD CONSTRAINT "account_avatar_medium_id_fkey" FOREIGN KEY ("medium_id") REFERENCES "medium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_header" ADD CONSTRAINT "account_header_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_header" ADD CONSTRAINT "account_header_medium_id_fkey" FOREIGN KEY ("medium_id") REFERENCES "medium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
