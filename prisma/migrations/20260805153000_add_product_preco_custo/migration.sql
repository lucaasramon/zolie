-- Preço de custo do produto: informado manualmente pelo admin no cadastro,
-- usado só para referência interna de margem. Nunca deve ser exposto pela API
-- pública (ver `decorate` em lib/services/product.service.ts).
ALTER TABLE "products" ADD COLUMN "preco_custo" DECIMAL(10,2);
