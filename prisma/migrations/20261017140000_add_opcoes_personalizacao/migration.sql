-- AlterTable
ALTER TABLE "products" ADD COLUMN "opcoes_personalizacao" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "valor_gravacao_verso" DECIMAL(10,2);
