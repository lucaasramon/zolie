-- CreateEnum
CREATE TYPE "OrderOrigin" AS ENUM ('SITE', 'PRESENCIAL');

-- AlterEnum
-- Formas de pagamento usadas apenas em venda presencial.
ALTER TYPE "PaymentMethod" ADD VALUE 'DINHEIRO';
ALTER TYPE "PaymentMethod" ADD VALUE 'PIX_PRESENCIAL';
ALTER TYPE "PaymentMethod" ADD VALUE 'DEBITO_MAQUININHA';
ALTER TYPE "PaymentMethod" ADD VALUE 'CREDITO_MAQUININHA';

-- AlterTable
-- Pedidos existentes só podiam vir do checkout, então o default SITE já os classifica.
ALTER TABLE "orders" ADD COLUMN "origem" "OrderOrigin" NOT NULL DEFAULT 'SITE';
ALTER TABLE "orders" ADD COLUMN "observacao" TEXT;
