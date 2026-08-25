-- DropForeignKey
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_user_id_fkey";

-- DropTable
DROP TABLE "email_verification_tokens";

-- DropTable
DROP TABLE "guest_email_verifications";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_verified";
