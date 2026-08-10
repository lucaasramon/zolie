-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_fkey";

-- DropIndex
DROP INDEX "cart_items_cart_id_product_id_tamanho_acabamento_key";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "acabamento";

-- DropTable
DROP TABLE "product_variants";

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_tamanho_key" ON "cart_items"("cart_id", "product_id", "tamanho");

