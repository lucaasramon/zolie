-- AlterEnum
ALTER TYPE "Material" ADD VALUE 'ACO';

-- AlterTable
ALTER TABLE "products" ADD COLUMN "personalizado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN "personalizacao" JSONB,
ADD COLUMN "personalizacao_key" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "personalizacao" JSONB;

-- DropIndex
DROP INDEX "cart_items_cart_id_product_id_tamanho_key";

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_tamanho_personalizacao_key_key" ON "cart_items"("cart_id", "product_id", "tamanho", "personalizacao_key");
