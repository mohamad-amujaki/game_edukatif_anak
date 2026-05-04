CREATE TABLE "ParentSession" (
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentSession_pkey" PRIMARY KEY ("token")
);

CREATE INDEX "ParentSession_expiresAt_idx" ON "ParentSession"("expiresAt");
