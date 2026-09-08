-- CreateTable
CREATE TABLE "stock_notifications" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notificado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_notifications_product_id_notificado_em_idx" ON "stock_notifications"("product_id", "notificado_em");

-- CreateIndex
CREATE UNIQUE INDEX "stock_notifications_product_id_email_key" ON "stock_notifications"("product_id", "email");

-- AddForeignKey
ALTER TABLE "stock_notifications" ADD CONSTRAINT "stock_notifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
