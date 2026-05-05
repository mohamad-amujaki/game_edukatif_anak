import type { Prisma } from '@prisma/client';
import { prisma } from '../db';
import type { DbClient } from '../db-client';
import { defaultDb } from '../db-client';
import { syncAndAwardDailyQuestBonus } from './daily-quest';
import { refreshMasteryForChild } from './mastery';
import { computeXp, starsFromMistakes } from './stars';
import { updateStreakAfterPlay } from './streak';
import { syncAndAwardWeeklyQuestBonus } from './weekly-quest';

export type SubmitResult = {
  stars: number;
  starsImproved: boolean;
  xpEarned: number;
  totalXp: number;
  newSticker: {
    id: string;
    name: string;
    imagePath: string;
    rarity: string;
  } | null;
  newBadges: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    iconPath: string;
  }>;
  levelProgress: { progressPct: number; isMastered: boolean };
  unlockedLevel: { id: string; title: string; track: string } | null;
  streak: { current: number; isNewRecord: boolean };
};

async function totalXp(childId: string, db?: DbClient): Promise<number> {
  const d = defaultDb(db);
  const agg = await d.xpLog.aggregate({
    where: { childId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

async function sumStars(childId: string, db?: DbClient): Promise<number> {
  const d = defaultDb(db);
  const progresses = await d.progress.findMany({ where: { childId } });
  return progresses.reduce((acc, p) => acc + p.bestStars, 0);
}

async function maybeAwardSticker(
  childId: string,
  db?: DbClient,
): Promise<SubmitResult['newSticker']> {
  const d = defaultDb(db);
  const total = await sumStars(childId, d);
  if (total === 0 || total % 10 !== 0) return null;

  const owned = await d.earnedSticker.findMany({
    where: { childId },
    select: { stickerId: true },
  });
  const ownedSet = new Set(owned.map((o) => o.stickerId));

  const pool = await d.stickerCatalog.findMany({
    where: ownedSet.size ? { id: { notIn: [...ownedSet] } } : undefined,
  });
  if (pool.length === 0) return null;

  const weights = pool.map((s) =>
    s.rarity === 'COMMON' ? 70 : s.rarity === 'RARE' ? 25 : 5,
  );
  const sumW = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sumW;
  let idx = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      idx = i;
      break;
    }
  }
  const pick = pool[idx] ?? pool[0];
  await d.earnedSticker.create({
    data: { childId, stickerId: pick.id },
  });
  return {
    id: pick.id,
    name: pick.name,
    imagePath: pick.imagePath,
    rarity: pick.rarity,
  };
}

async function awardEligibleBadges(
  childId: string,
  db?: DbClient,
): Promise<SubmitResult['newBadges']> {
  const d = defaultDb(db);
  const out: SubmitResult['newBadges'] = [];

  const child = await d.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return out;

  const earnedCodes = new Set(
    (
      await d.earnedBadge.findMany({
        where: { childId },
        include: { badge: true },
      })
    ).map((e) => e.badge.code),
  );

  const badges = await d.badgeCatalog.findMany();

  const activityCount = await d.progress.count({
    where: { childId, firstCompletedAt: { not: null } },
  });

  const threeStarCount = await d.progress.count({
    where: { childId, bestStars: 3 },
  });

  const streak = await d.dailyStreak.findUnique({ where: { childId } });

  const stickerCount = await d.earnedSticker.count({ where: { childId } });

  const lit1 = await d.levelDefinition.findFirst({
    where: { track: 'literasi', order: 1, ageMode: child.ageMode },
  });
  const math1 = await d.levelDefinition.findFirst({
    where: { track: 'math', order: 1, ageMode: child.ageMode },
  });

  const evaluators: Record<string, () => Promise<boolean>> = {
    FIRST_STEP: async () => activityCount >= 1,
    THREE_STARS: async () => threeStarCount >= 1,
    STREAK_3: async () => (streak?.currentStreak ?? 0) >= 3,
    STREAK_7: async () => (streak?.currentStreak ?? 0) >= 7,
    COLLECTOR_5: async () => stickerCount >= 5,
    MASTER_LIT_1: async () => {
      if (!lit1) return false;
      const lm = await d.levelMastery.findUnique({
        where: { childId_levelId: { childId, levelId: lit1.id } },
      });
      return lm?.isMastered ?? false;
    },
    MASTER_MATH_1: async () => {
      if (!math1) return false;
      const lm = await d.levelMastery.findUnique({
        where: { childId_levelId: { childId, levelId: math1.id } },
      });
      return lm?.isMastered ?? false;
    },
  };

  for (const b of badges) {
    if (earnedCodes.has(b.code)) continue;
    const fn = evaluators[b.code];
    if (!fn) continue;
    if (await fn()) {
      await d.earnedBadge.create({ data: { childId, badgeId: b.id } });
      out.push({
        id: b.id,
        code: b.code,
        name: b.name,
        description: b.description,
        iconPath: b.iconPath,
      });
    }
  }

  return out;
}

export async function submitActivity(args: {
  childId: string;
  activityId: string;
  mistakes: number;
  durationSec: number;
  score: number;
}): Promise<SubmitResult> {
  const { childId, activityId, mistakes, score: scoreValue } = args;

  return prisma.$transaction(async (tx) => {
    const d = defaultDb(tx);

    const child = await d.childProfile.findUnique({
      where: { id: childId },
    });
    if (!child) throw new Error('NOT_FOUND');

    const activity = await d.activityDefinition.findUnique({
      where: { id: activityId },
      include: { level: true },
    });
    if (!activity) throw new Error('NOT_FOUND');

    const stars = starsFromMistakes(mistakes);

    const existing = await d.progress.findUnique({
      where: { childId_activityId: { childId, activityId } },
    });

    const isFirstComplete = !existing?.firstCompletedAt;
    const streakRes = await updateStreakAfterPlay(childId, d);
    const xpAmount = computeXp({
      stars,
      isFirstComplete,
      streakBonus: streakRes.streakBonus,
    });

    const starsImproved = !existing || stars > existing.bestStars;

    await d.progress.upsert({
      where: { childId_activityId: { childId, activityId } },
      create: {
        childId,
        activityId,
        bestScore: scoreValue,
        bestStars: stars,
        totalAttempts: 1,
        firstCompletedAt: new Date(),
        lastPlayedAt: new Date(),
      },
      update: {
        bestStars: Math.max(existing?.bestStars ?? 0, stars),
        bestScore: Math.max(existing?.bestScore ?? 0, scoreValue),
        totalAttempts: { increment: 1 },
        lastPlayedAt: new Date(),
        firstCompletedAt: existing?.firstCompletedAt ?? new Date(),
      },
    });

    const xpLogs: Prisma.XpLogCreateManyInput[] = [
      {
        childId,
        amount: xpAmount,
        source: isFirstComplete ? 'ACTIVITY_COMPLETE' : 'REPLAY',
        refId: activityId,
      },
    ];

    await d.xpLog.createMany({ data: xpLogs });

    const unlockedBefore = new Set(
      (
        await d.levelMastery.findMany({
          where: { childId, isUnlocked: true },
          select: { levelId: true },
        })
      ).map((r) => r.levelId),
    );

    await refreshMasteryForChild(childId, child.ageMode, d);

    const newlyUnlocked = await d.levelMastery.findMany({
      where: { childId, isUnlocked: true },
      select: { levelId: true },
    });
    let levelUpXp = 0;
    for (const { levelId } of newlyUnlocked) {
      if (unlockedBefore.has(levelId)) continue;
      levelUpXp += 50;
      await d.xpLog.create({
        data: {
          childId,
          amount: 50,
          source: 'LEVEL_UP',
          refId: levelId,
        },
      });
    }

    const questXp = await syncAndAwardDailyQuestBonus(
      childId,
      child.ageMode,
      d,
    );

    const weekly = await syncAndAwardWeeklyQuestBonus(
      childId,
      activityId,
      stars,
      d,
    );

    const activitiesInLevel = await d.activityDefinition.findMany({
      where: { levelId: activity.levelId },
      orderBy: { order: 'asc' },
    });

    const progInLevel = await d.progress.findMany({
      where: {
        childId,
        activityId: { in: activitiesInLevel.map((a) => a.id) },
      },
    });
    const pmap = new Map(progInLevel.map((p) => [p.activityId, p.bestStars]));
    const done = activitiesInLevel.filter(
      (a) => (pmap.get(a.id) ?? 0) >= 1,
    ).length;
    const progressPct =
      activitiesInLevel.length === 0
        ? 0
        : Math.round((done / activitiesInLevel.length) * 100);

    const allGe3 = activitiesInLevel.every((a) => (pmap.get(a.id) ?? 0) >= 3);

    const allGe2 =
      activitiesInLevel.length > 0 &&
      activitiesInLevel.every((a) => (pmap.get(a.id) ?? 0) >= 2);

    let unlockedLevel: SubmitResult['unlockedLevel'] = null;
    const nextLevel = await d.levelDefinition.findFirst({
      where: {
        track: activity.level.track,
        ageMode: activity.level.ageMode,
        order: activity.level.order + 1,
      },
    });
    if (nextLevel && allGe2) {
      const lm = await d.levelMastery.findUnique({
        where: { childId_levelId: { childId, levelId: nextLevel.id } },
      });
      if (lm?.isUnlocked) {
        unlockedLevel = {
          id: nextLevel.id,
          title: nextLevel.title,
          track: nextLevel.track,
        };
      }
    }

    const regularSticker = await maybeAwardSticker(childId, d);
    const newSticker = weekly.sticker ?? regularSticker;
    const newBadges = await awardEligibleBadges(childId, d);

    const streakRow = await d.dailyStreak.findUnique({ where: { childId } });

    const bonusXp = levelUpXp + questXp + weekly.xp;
    const totalEarnedThisSubmit = xpAmount + bonusXp;

    return {
      stars,
      starsImproved,
      xpEarned: totalEarnedThisSubmit,
      totalXp: await totalXp(childId, d),
      newSticker,
      newBadges,
      levelProgress: { progressPct, isMastered: allGe3 },
      unlockedLevel,
      streak: {
        current: streakRow?.currentStreak ?? 0,
        isNewRecord:
          (streakRow?.currentStreak ?? 0) >= (streakRow?.longestStreak ?? 0) &&
          (streakRow?.currentStreak ?? 0) > 0,
      },
    };
  });
}
