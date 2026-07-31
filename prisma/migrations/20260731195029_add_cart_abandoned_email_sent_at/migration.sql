-- DropIndex
DROP INDEX "products_descricao_trgm_idx";

-- DropIndex
DROP INDEX "products_nome_trgm_idx";

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "abandoned_email_sent_at" TIMESTAMP(3);
