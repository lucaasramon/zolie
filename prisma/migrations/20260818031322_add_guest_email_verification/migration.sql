-- CreateTable
CREATE TABLE "guest_email_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_email_verifications_token_key" ON "guest_email_verifications"("token");

-- CreateIndex
CREATE INDEX "guest_email_verifications_email_idx" ON "guest_email_verifications"("email");
