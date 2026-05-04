ALTER TYPE "XpSource" ADD VALUE 'WEEKLY_QUEST';

ALTER TABLE "DailyStreak" ADD COLUMN "weekQuestWeekStart" TEXT,
ADD COLUMN "weekQuestActivityIdsDone" TEXT,
ADD COLUMN "weekQuestBonusWeekStart" TEXT;
