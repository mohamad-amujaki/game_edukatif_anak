-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "guestBindingId" TEXT,
ADD COLUMN     "ownerUserId" TEXT;

-- CreateIndex
CREATE INDEX "ChildProfile_ownerUserId_idx" ON "ChildProfile"("ownerUserId");

-- CreateIndex
CREATE INDEX "ChildProfile_guestBindingId_idx" ON "ChildProfile"("guestBindingId");

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
