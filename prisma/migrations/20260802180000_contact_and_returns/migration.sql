-- ============================================================
-- Item 12 — Mensagens de contato
-- ============================================================

CREATE TABLE "contact_messages" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "assunto" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,
  "pedido" TEXT,
  "respondida" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_messages_respondida_created_at_idx"
  ON "contact_messages"("respondida", "created_at");

-- ============================================================
-- Item 15 — Trocas e devoluções
-- ============================================================

CREATE TYPE "ReturnStatus" AS ENUM ('SOLICITADA', 'APROVADA', 'RECUSADA', 'RECEBIDA', 'CONCLUIDA');
CREATE TYPE "ReturnType" AS ENUM ('TROCA', 'DEVOLUCAO');

CREATE TABLE "return_requests" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tipo" "ReturnType" NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'SOLICITADA',
  "motivo" TEXT NOT NULL,
  "descricao" TEXT,
  "imagens" TEXT[],
  "resposta_admin" TEXT,
  "codigo_reversa" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "return_requests_user_id_idx" ON "return_requests"("user_id");
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");

CREATE TABLE "return_items" (
  "id" TEXT NOT NULL,
  "return_id" TEXT NOT NULL,
  "order_item_id" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "return_items_return_id_idx" ON "return_items"("return_id");

ALTER TABLE "return_requests"
  ADD CONSTRAINT "return_requests_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "return_requests"
  ADD CONSTRAINT "return_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "return_items"
  ADD CONSTRAINT "return_items_return_id_fkey"
  FOREIGN KEY ("return_id") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "return_items"
  ADD CONSTRAINT "return_items_order_item_id_fkey"
  FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
