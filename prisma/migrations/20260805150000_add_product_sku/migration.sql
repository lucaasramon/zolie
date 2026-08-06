-- SKU do produto: código interno opcional definido manualmente pelo admin no
-- cadastro/edição de produto, usado para identificação/controle (ex.: em
-- planilhas e etiquetas). Independe do `sku` de `product_variants`, que é
-- por combinação de tamanho/acabamento e ainda não é usado em nenhuma tela.
ALTER TABLE "products" ADD COLUMN "sku" TEXT;

CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
