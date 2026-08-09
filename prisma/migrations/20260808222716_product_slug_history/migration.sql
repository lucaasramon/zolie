-- CreateTable
CREATE TABLE "product_slug_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "old_slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_history_old_slug_key" ON "product_slug_history"("old_slug");

-- CreateIndex
CREATE INDEX "product_slug_history_product_id_idx" ON "product_slug_history"("product_id");

-- AddForeignKey
ALTER TABLE "product_slug_history" ADD CONSTRAINT "product_slug_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

