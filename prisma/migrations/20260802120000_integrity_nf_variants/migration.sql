-- ============================================================
-- Item 9 — Integridade
-- ============================================================

-- Soft delete de endereço: `orders` referencia `addresses`, então o hard delete
-- anterior quebrava o histórico fiscal do pedido (ou falhava por FK).
ALTER TABLE "addresses" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Numeração de pedido à prova de concorrência. Antes vinha de COUNT(*), que faz
-- dois checkouts simultâneos gerarem o mesmo número e o UNIQUE derrubar a compra.
-- Começa acima do maior número já emitido para não colidir com o histórico.
CREATE SEQUENCE IF NOT EXISTS order_number_seq AS BIGINT START WITH 2495;

SELECT setval(
  'order_number_seq',
  GREATEST(
    2495,
    COALESCE(
      (SELECT MAX(NULLIF(regexp_replace(numero, '\D', '', 'g'), '')::BIGINT) FROM "orders"),
      2494
    ) + 1
  ),
  false
);

-- ============================================================
-- Item 7 — Nota fiscal
-- ============================================================

ALTER TABLE "orders" ADD COLUMN "nota_fiscal_url" TEXT;
ALTER TABLE "orders" ADD COLUMN "nota_fiscal_chave" TEXT;
ALTER TABLE "orders" ADD COLUMN "nota_fiscal_numero" TEXT;

-- ============================================================
-- Item 10 — Estoque por variação
-- ============================================================

CREATE TABLE "product_variants" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "tamanho" TEXT,
  "acabamento" TEXT,
  "estoque" INTEGER NOT NULL DEFAULT 0,
  "peso_gramas" DECIMAL(6,2),
  "sku" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- NULLS NOT DISTINCT: sem isso o Postgres trataria cada (produto, NULL, NULL)
-- como distinto e permitiria variantes duplicadas em produtos sem tamanho.
CREATE UNIQUE INDEX "product_variants_product_id_tamanho_acabamento_key"
  ON "product_variants"("product_id", "tamanho", "acabamento") NULLS NOT DISTINCT;

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: cria uma variante por combinação tamanho × acabamento de cada produto.
-- O estoque atual é DIVIDIDO entre as variantes (com o resto indo para a primeira),
-- e não copiado — copiar multiplicaria o estoque real por N.
WITH combinacoes AS (
  SELECT
    p.id AS product_id,
    COALESCE(NULLIF(t.tamanho, ''), NULL) AS tamanho,
    a.acabamento,
    p.estoque,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.tamanho, a.acabamento) AS posicao,
    COUNT(*) OVER (PARTITION BY p.id) AS total
  FROM "products" p
  -- Produto sem tamanhos cadastrados gera uma única variante com tamanho NULL.
  LEFT JOIN LATERAL unnest(
    CASE WHEN array_length(p.tamanhos, 1) > 0 THEN p.tamanhos ELSE ARRAY[NULL]::TEXT[] END
  ) AS t(tamanho) ON true
  CROSS JOIN (VALUES ('Polido'), ('Fosco')) AS a(acabamento)
)
INSERT INTO "product_variants" ("id", "product_id", "tamanho", "acabamento", "estoque", "ativo", "created_at", "updated_at")
SELECT
  gen_random_uuid()::TEXT,
  product_id,
  tamanho,
  acabamento,
  (estoque / total) + CASE WHEN posicao = 1 THEN estoque % total ELSE 0 END,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM combinacoes;
