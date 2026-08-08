-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_endereco_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "guest_bairro" TEXT,
ADD COLUMN     "guest_cep" TEXT,
ADD COLUMN     "guest_cidade" TEXT,
ADD COLUMN     "guest_complemento" TEXT,
ADD COLUMN     "guest_cpf" TEXT,
ADD COLUMN     "guest_email" TEXT,
ADD COLUMN     "guest_estado" CHAR(2),
ADD COLUMN     "guest_nome" TEXT,
ADD COLUMN     "guest_numero" TEXT,
ADD COLUMN     "guest_rua" TEXT,
ADD COLUMN     "guest_telefone" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "endereco_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

