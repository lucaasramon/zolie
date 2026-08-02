-- Etiqueta do Melhor Envio. `melhor_envio_id` é o id do envio criado no
-- checkout (usado depois para gerar, imprimir e buscar o rastreio) e
-- `etiqueta_url` guarda o PDF pronto para impressão.
-- `envio_servico_id` é a modalidade escolhida na cotação (PAC, Sedex...), antes
-- descartada: só o nome era guardado, e a compra da etiqueta precisa do id.
ALTER TABLE "orders" ADD COLUMN "envio_servico_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "melhor_envio_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "etiqueta_url" TEXT;

CREATE UNIQUE INDEX "orders_melhor_envio_id_key" ON "orders"("melhor_envio_id");
