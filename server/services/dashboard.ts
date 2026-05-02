import type { Track } from '@prisma/client';
import { prisma } from '../db';

async function levelProgressPct(
  childId: string,
  levelId: string,
): Promise<number> {
  const acts = await prisma.activityDefinition.findMany({ where: { levelId } });
  if (acts.length === 0) return 0;
  const prog = await prisma.progress.findMany({
    where: { childId, activityId: { in: acts.map((a) => a.id) } },
  });
  const pmap = new Map(prog.map((p) => [p.activityId, p.bestStars]));
  const done = acts.filter((a) => (pmap.get(a.id) ?? 0) >= 1).length;
  return Math.round((done / acts.length) * 100);
}

export async function buildDashboard(childId: string) {
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return null;

  const xpAgg = await prisma.xpLog.aggregate({
    where: { childId },
    _sum: { amount: true },
  });
  const progresses = await prisma.progress.findMany({ where: { childId } });
  const totalXp = xpAgg._sum.amount ?? 0;
  const totalStars = progresses.reduce((a, p) => a + p.bestStars, 0);

  const streakRow = await prisma.dailyStreak.findUnique({ where: { childId } });

  const tracks: Track[] = ['literasi', 'math'];
  const trackSummaries = [];

  for (const track of tracks) {
    const levels = await prisma.levelDefinition.findMany({
      where: { ageMode: child.ageMode, track },
      orderBy: { order: 'asc' },
    });

    let totalLevelsCompleted = 0;
    let currentLevel: {
      id: string;
      order: number;
      title: string;
      progressPct: number;
    } | null = null;

    for (const level of levels) {
      const mastery = await prisma.levelMastery.findUnique({
        where: { childId_levelId: { childId, levelId: level.id } },
      });
      if (mastery?.isMastered) totalLevelsCompleted++;
    }

    for (const level of levels) {
      const mastery = await prisma.levelMastery.findUnique({
        where: { childId_levelId: { childId, levelId: level.id } },
      });
      if (!mastery?.isUnlocked) continue;

      const pct = await levelProgressPct(childId, level.id);
      currentLevel = {
        id: level.id,
        order: level.order,
        title: level.title,
        progressPct: pct,
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

  const allLevels = await prisma.levelDefinition.findMany({
    where: { ageMode: child.ageMode },
    orderBy: [{ track: 'asc' }, { order: 'asc' }],
  });

  for (const level of allLevels) {
    const mastery = await prisma.levelMastery.findUnique({
      where: { childId_levelId: { childId, levelId: level.id } },
    });
    if (!mastery?.isUnlocked) continue;

    const acts = await prisma.activityDefinition.findMany({
      where: { levelId: level.id },
    });
    for (const act of acts) {
      const p = await prisma.progress.findUnique({
        where: { childId_activityId: { childId, activityId: act.id } },
      });
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

  const recentBadges = await prisma.earnedBadge.findMany({
    where: { childId },
    orderBy: { earnedAt: 'desc' },
    take: 5,
    include: { badge: true },
  });

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
    recentBadges: recentBadges.map((e) => ({
      id: e.badge.id,
      name: e.badge.name,
      iconPath: e.badge.iconPath,
      earnedAt: e.earnedAt.toISOString(),
    })),
  };
}
