-- Email mingguan (opt-in) + token pemulihan PIN sekali pakai
ALTER TABLE "ParentSettings" ADD COLUMN IF NOT EXISTS "parentEmail" TEXT;
ALTER TABLE "ParentSettings" ADD COLUMN IF NOT EXISTS "weeklyEmailOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ParentSettings" ADD COLUMN IF NOT EXISTS "pinRecoveryTokenHash" TEXT;
ALTER TABLE "ParentSettings" ADD COLUMN IF NOT EXISTS "pinRecoveryTokenExpires" TIMESTAMP(3);
