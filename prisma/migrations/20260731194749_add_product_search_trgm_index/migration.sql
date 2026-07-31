-- Habilita busca por similaridade de texto (tolera erros de digitação) e cria
-- índices GIN em nome/descrição para acelerar buscas ILIKE '%termo%' que antes
-- exigiam table scan completo.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_nome_trgm_idx" ON "products" USING GIN ("nome" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_descricao_trgm_idx" ON "products" USING GIN ("descricao" gin_trgm_ops);
