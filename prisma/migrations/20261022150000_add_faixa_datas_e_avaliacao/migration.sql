-- Faixa de datas comemorativas ("peça até X para chegar antes do Natal"), ligável no admin.
-- AlterTable
ALTER TABLE "site_config" ADD COLUMN "faixa_datas_ativa" BOOLEAN NOT NULL DEFAULT true;

-- Pedido de avaliação enviado por e-mail depois da entrega (no máximo um por pedido).
-- AlterTable
ALTER TABLE "orders" ADD COLUMN "avaliacao_solicitada_em" TIMESTAMP(3);

-- Cupom de agradecimento gerado quando uma avaliação com foto é aprovada.
-- AlterTable
ALTER TABLE "product_reviews" ADD COLUMN "cupom_recompensa" TEXT;

-- Cupom pessoal: só a cliente dona do cupom pode ver e usar (ex.: recompensa por avaliação com foto).
-- AlterTable
ALTER TABLE "coupons" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "coupons_user_id_idx" ON "coupons"("user_id");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
