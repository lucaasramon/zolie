-- Permite carrinho de convidado: user_id passa a ser opcional e session_id
-- (identificador de sessão anônima em cookie) é adicionado como alternativa única.
ALTER TABLE "carts" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "carts" ADD COLUMN "session_id" TEXT;

CREATE UNIQUE INDEX "carts_session_id_key" ON "carts"("session_id");
