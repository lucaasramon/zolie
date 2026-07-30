-- AlterTable
ALTER TABLE "users" ADD COLUMN "asaas_customer_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "asaas_payment_id" TEXT,
ADD COLUMN "asaas_status" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_asaas_customer_id_key" ON "users"("asaas_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_asaas_payment_id_key" ON "orders"("asaas_payment_id");
