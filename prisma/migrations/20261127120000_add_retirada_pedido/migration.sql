-- Retirada em Fortaleza/CE: pedido sem endereço nem frete; a entrega é combinada pelo WhatsApp.
-- AlterTable
ALTER TABLE "orders" ADD COLUMN "retirada" BOOLEAN NOT NULL DEFAULT false;
