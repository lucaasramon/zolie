-- CreateTable
CREATE TABLE "guest_order_access" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_order_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_order_access_email_key" ON "guest_order_access"("email");

-- CreateIndex
CREATE UNIQUE INDEX "guest_order_access_token_key" ON "guest_order_access"("token");
