import type { AgeMode, Track } from '@prisma/client';
import { prisma } from '../db';

/** Buat baris LevelMastery untuk semua level sesuai mode anak */
export async function initializeLevelMastery(
  childId: string,
  ageMode: AgeMode,
): Promise<void> {
  const levels = await prisma.levelDefinition.findMany({
    where: { ageMode },
    orderBy: [{ track: 'asc' }, { order: 'asc' }],
  });

  for (const level of levels) {
    const isFirstInTrack = level.order === 1;
    await prisma.levelMastery.upsert({
      where: { childId_levelId: { childId, levelId: level.id } },
      create: {
        childId,
        levelId: level.id,
        isUnlocked: isFirstInTrack,
        isMastered: false,
        unlockedAt: isFirstInTrack ? new Date() : undefined,
      },
      update: {},
    });
  }
}

async function levelCompletionState(
  childId: string,
  levelId: string,
): Promise<{ allGe2: boolean; allGe3: boolean; count: number }> {
  const activities = await prisma.activityDefinition.findMany({
    where: { levelId },
  });
  if (activities.length === 0) return { allGe2: true, allGe3: true, count: 0 };

  const progresses = await prisma.progress.findMany({
    where: { childId, activityId: { in: activities.map((a) => a.id) } },
  });
  const map = new Map(progresses.map((p) => [p.activityId, p.bestStars]));

  let allGe2 = true;
  let allGe3 = true;
  for (const a of activities) {
    const s = map.get(a.id) ?? 0;
    if (s < 2) allGe2 = false;
    if (s < 3) allGe3 = false;
  }
  return { allGe2, allGe3, count: activities.length };
}

/** Setelah progress berubah, perbarui unlock/mastered per track */
export async function refreshMasteryForChild(
  childId: string,
  ageMode: AgeMode,
): Promise<void> {
  const tracks: Track[] = ['literasi', 'math'];

  for (const track of tracks) {
    const levels = await prisma.levelDefinition.findMany({
      where: { ageMode, track },
      orderBy: { order: 'asc' },
    });

    let prevUnlocked = false;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const { allGe3 } = await levelCompletionState(childId, level.id);

      let isUnlocked = level.order === 1;
      if (!isUnlocked && i > 0) {
        const prev = levels[i - 1];
        const prevState = await levelCompletionState(childId, prev.id);
        isUnlocked = prevState.allGe2;
      }

      const isMastered = allGe3;

      const existing = await prisma.levelMastery.findUnique({
        where: { childId_levelId: { childId, levelId: level.id } },
      });

      await prisma.levelMastery.upsert({
        where: { childId_levelId: { childId, levelId: level.id } },
        create: {
          childId,
          levelId: level.id,
          isUnlocked,
          isMastered,
          unlockedAt: isUnlocked ? new Date() : undefined,
          masteredAt: isMastered ? new Date() : undefined,
        },
        update: {
          isUnlocked,
          isMastered,
          ...(isUnlocked && !existing?.unlockedAt
            ? { unlockedAt: new Date() }
            : {}),
          ...(isMastered ? { masteredAt: new Date() } : { masteredAt: null }),
        },
      });

      prevUnlocked = isUnlocked;
      void prevUnlocked;
    }
  }
}
