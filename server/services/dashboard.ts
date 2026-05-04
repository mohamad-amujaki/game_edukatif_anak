import type { AgeMode, Track } from '@prisma/client';
import { prisma } from '../db';
import { type DbClient, defaultDb } from '../db-client';
import { utcMondayDateKey } from './weekly-quest';

/** Daftar ID aktivitas unlocked yang belum pernah selesai (≥1★), diurutkan seperti dashboard. */
export async function getFirstNIncompleteUnlockedActivityIds(
  childId: string,
  ageMode: AgeMode,
  limit: number,
  db?: DbClient,
): Promise<string[]> {
  const d = defaultDb(db);

  const [allLevels, masteryRows, progressRows] = await Promise.all([
    d.levelDefinition.findMany({
      where: { ageMode },
      orderBy: [{ track: 'asc' }, { order: 'asc' }],
      include: { activities: { orderBy: { order: 'asc' } } },
    }),
    d.levelMastery.findMany({ where: { childId } }),
    d.progress.findMany({ where: { childId } }),
  ]);

  const masteryMap = new Map(masteryRows.map((m) => [m.levelId, m]));
  const progressMap = new Map(progressRows.map((p) => [p.activityId, p]));

  const unlockedActs: Array<{ activityId: string; isCompleted: boolean }> = [];

  for (const level of allLevels) {
    const mastery = masteryMap.get(level.id);
    if (!mastery?.isUnlocked) continue;
    for (const act of level.activities) {
      const p = progressMap.get(act.id);
      const isCompleted = (p?.bestStars ?? 0) >= 1;
      unlockedActs.push({ activityId: act.id, isCompleted });
    }
  }

  return unlockedActs
    .filter((a) => !a.isCompleted)
    .slice(0, limit)
    .map((a) => a.activityId);
}

export async function buildDashboard(childId: string) {
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return null;

  const [
    xpAgg,
    progresses,
    streakRow,
    parentSettings,
    recentBadges,
    allLevels,
    masteryRows,
  ] = await Promise.all([
    prisma.xpLog.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
    prisma.progress.findMany({ where: { childId } }),
    prisma.dailyStreak.findUnique({ where: { childId } }),
    prisma.parentSettings.findUnique({
      where: { id: 'singleton' },
    }),
    prisma.earnedBadge.findMany({
      where: { childId },
      orderBy: { earnedAt: 'desc' },
      take: 5,
      include: { badge: true },
    }),
    prisma.levelDefinition.findMany({
      where: { ageMode: child.ageMode },
      orderBy: [{ track: 'asc' }, { order: 'asc' }],
      include: { activities: { orderBy: { order: 'asc' } } },
    }),
    prisma.levelMastery.findMany({ where: { childId } }),
  ]);

  const progressMap = new Map(progresses.map((p) => [p.activityId, p]));
  const masteryMap = new Map(masteryRows.map((m) => [m.levelId, m]));

  const totalXp = xpAgg._sum.amount ?? 0;
  const totalStars = progresses.reduce((a, p) => a + p.bestStars, 0);

  function levelProgressPct(levelId: string): number {
    const level = allLevels.find((l) => l.id === levelId);
    if (!level || level.activities.length === 0) return 0;
    const acts = level.activities;
    const done = acts.filter(
      (a) => (progressMap.get(a.id)?.bestStars ?? 0) >= 1,
    ).length;
    return Math.round((done / acts.length) * 100);
  }

  const tracks: Track[] = ['literasi', 'math'];
  const trackSummaries = [];

  for (const track of tracks) {
    const levels = allLevels
      .filter((l) => l.track === track)
      .sort((a, b) => a.order - b.order);

    let totalLevelsCompleted = 0;
    for (const level of levels) {
      const mastery = masteryMap.get(level.id);
      if (mastery?.isMastered) totalLevelsCompleted++;
    }

    let currentLevel: {
      id: string;
      order: number;
      title: string;
      progressPct: number;
    } | null = null;

    for (const level of levels) {
      const mastery = masteryMap.get(level.id);
      if (!mastery?.isUnlocked) continue;

      currentLevel = {
        id: level.id,
        order: level.order,
        title: level.title,
        progressPct: levelProgressPct(level.id),
      };
      if (!mastery.isMastered) break;
    }

    trackSummaries.push({
      track,
      currentLevel,
      totalLevelsCompleted,
    });
  }

  const unlockedActs: Array<{
    activityId: string;
    activityTitle: string;
    track: Track;
    levelTitle: string;
    isCompleted: boolean;
    estimatedSec: number;
  }> = [];

  for (const level of allLevels) {
    const mastery = masteryMap.get(level.id);
    if (!mastery?.isUnlocked) continue;

    for (const act of level.activities) {
      const p = progressMap.get(act.id);
      const isCompleted = (p?.bestStars ?? 0) >= 1;
      unlockedActs.push({
        activityId: act.id,
        activityTitle: act.title,
        track: level.track,
        levelTitle: level.title,
        isCompleted,
        estimatedSec: act.estimatedSec,
      });
    }
  }

  const incomplete = unlockedActs.filter((a) => !a.isCompleted).slice(0, 4);

  const weekKey = utcMondayDateKey();
  let weeklyDistinct = 0;
  let weeklyBonusEarned = false;
  if (streakRow?.weekQuestWeekStart === weekKey) {
    weeklyBonusEarned = streakRow.weekQuestBonusWeekStart === weekKey;
    try {
      const raw = streakRow.weekQuestActivityIdsDone;
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      weeklyDistinct = Array.isArray(arr) ? arr.length : 0;
    } catch {
      weeklyDistinct = 0;
    }
  }

  return {
    child: {
      id: child.id,
      name: child.name,
      avatarKey: child.avatarKey,
      ageMode: child.ageMode,
      createdAt: child.createdAt.toISOString(),
    },
    totalXp,
    totalStars,
    streak: {
      current: streakRow?.currentStreak ?? 0,
      longest: streakRow?.longestStreak ?? 0,
      lastPlayedDate: streakRow?.lastPlayedDate ?? null,
    },
    tracks: trackSummaries,
    todayQuests: incomplete,
    weeklyQuest: {
      distinctActivitiesThisWeek: weeklyDistinct,
      target: 10,
      bonusXpClaimedThisWeek: weeklyBonusEarned,
    },
    wellness: {
      dailyTimeCapMinutes: parentSettings?.dailyTimeCapMinutes ?? 30,
      breakReminderMinutes: parentSettings?.breakReminderMinutes ?? 15,
      sfxEnabled: parentSettings?.sfxEnabled ?? true,
      musicEnabled: parentSettings?.musicEnabled ?? true,
      reduceMotion: parentSettings?.reduceMotion ?? false,
    },
    recentBadges: recentBadges.map((e) => ({
      id: e.badge.id,
      name: e.badge.name,
      iconPath: e.badge.iconPath,
      earnedAt: e.earnedAt.toISOString(),
    })),
  };
}
