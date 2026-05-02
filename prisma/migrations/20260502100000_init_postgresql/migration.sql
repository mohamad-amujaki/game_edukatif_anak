-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgeMode" AS ENUM ('TK', 'SD1');

-- CreateEnum
CREATE TYPE "Track" AS ENUM ('literasi', 'math');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('HURUF_GAMBAR_MATCHING', 'SUSUN_SUKU_KATA', 'BACA_KALIMAT_PENDEK', 'HITUNG_BENDA', 'BANDINGKAN_LEBIH_KURANG', 'PENJUMLAHAN_VISUAL', 'PENGURANGAN_VISUAL');

-- CreateEnum
CREATE TYPE "XpSource" AS ENUM ('ACTIVITY_COMPLETE', 'STAR_BONUS', 'DAILY_STREAK', 'DAILY_QUEST', 'LEVEL_UP', 'REPLAY');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'EPIC');

-- CreateEnum
CREATE TYPE "AuditActor" AS ENUM ('ADMIN', 'SUPER_PARENT');

-- CreateTable
CREATE TABLE "ParentSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pinHash" TEXT,
    "pinSetupQuestion" TEXT,
    "pinSetupAnswerHash" TEXT,
    "dailyTimeCapMinutes" INTEGER NOT NULL DEFAULT 30,
    "breakReminderMinutes" INTEGER NOT NULL DEFAULT 15,
    "musicEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sfxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
    "isSuperParent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarKey" TEXT NOT NULL,
    "ageMode" "AgeMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelDefinition" (
    "id" TEXT NOT NULL,
    "track" "Track" NOT NULL,
    "ageMode" "AgeMode" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,

    CONSTRAINT "LevelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityDefinition" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "voiceOverKeys" TEXT NOT NULL,
    "estimatedSec" INTEGER NOT NULL DEFAULT 180,

    CONSTRAINT "ActivityDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "bestStars" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "firstCompletedAt" TIMESTAMP(3),
    "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelMastery" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),

    CONSTRAINT "LevelMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "XpSource" NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StickerCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "theme" TEXT NOT NULL,

    CONSTRAINT "StickerCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarnedSticker" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "stickerId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarnedSticker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconPath" TEXT NOT NULL,
    "criteriaKey" TEXT NOT NULL,

    CONSTRAINT "BadgeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarnedBadge" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarnedBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStreak" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedDate" TEXT,
    "questTargetDate" TEXT,
    "questTargetActivityIds" TEXT,
    "questBonusDate" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaySession" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "dateKey" TEXT NOT NULL,

    CONSTRAINT "PlaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "AuditActor" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminGlobalSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultDailyTimeCapMinutes" INTEGER NOT NULL DEFAULT 30,
    "defaultBreakReminderMinutes" INTEGER NOT NULL DEFAULT 20,
    "contentLockedForEdit" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "AdminGlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "ChildProfile_createdAt_idx" ON "ChildProfile"("createdAt");

-- CreateIndex
CREATE INDEX "LevelDefinition_track_ageMode_idx" ON "LevelDefinition"("track", "ageMode");

-- CreateIndex
CREATE UNIQUE INDEX "LevelDefinition_track_ageMode_order_key" ON "LevelDefinition"("track", "ageMode", "order");

-- CreateIndex
CREATE INDEX "ActivityDefinition_levelId_idx" ON "ActivityDefinition"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityDefinition_levelId_order_key" ON "ActivityDefinition"("levelId", "order");

-- CreateIndex
CREATE INDEX "Progress_childId_idx" ON "Progress"("childId");

-- CreateIndex
CREATE INDEX "Progress_activityId_idx" ON "Progress"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_childId_activityId_key" ON "Progress"("childId", "activityId");

-- CreateIndex
CREATE INDEX "LevelMastery_childId_idx" ON "LevelMastery"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelMastery_childId_levelId_key" ON "LevelMastery"("childId", "levelId");

-- CreateIndex
CREATE INDEX "XpLog_childId_createdAt_idx" ON "XpLog"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "EarnedSticker_childId_idx" ON "EarnedSticker"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "EarnedSticker_childId_stickerId_key" ON "EarnedSticker"("childId", "stickerId");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeCatalog_code_key" ON "BadgeCatalog"("code");

-- CreateIndex
CREATE INDEX "EarnedBadge_childId_idx" ON "EarnedBadge"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "EarnedBadge_childId_badgeId_key" ON "EarnedBadge"("childId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStreak_childId_key" ON "DailyStreak"("childId");

-- CreateIndex
CREATE INDEX "PlaySession_childId_dateKey_idx" ON "PlaySession"("childId", "dateKey");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorType_actorId_idx" ON "AuditLog"("actorType", "actorId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDefinition" ADD CONSTRAINT "ActivityDefinition_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "LevelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelMastery" ADD CONSTRAINT "LevelMastery_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelMastery" ADD CONSTRAINT "LevelMastery_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "LevelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpLog" ADD CONSTRAINT "XpLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnedSticker" ADD CONSTRAINT "EarnedSticker_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnedSticker" ADD CONSTRAINT "EarnedSticker_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "StickerCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnedBadge" ADD CONSTRAINT "EarnedBadge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnedBadge" ADD CONSTRAINT "EarnedBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStreak" ADD CONSTRAINT "DailyStreak_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaySession" ADD CONSTRAINT "PlaySession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

