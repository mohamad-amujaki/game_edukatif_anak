import type { AgeMode, Track } from '@prisma/client';
import { prisma } from '../db';
import { type DbClient, defaultDb } from '../db-client';

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

/** Setelah progress berubah, perbarui unlock/mastered per track */
export async function refreshMasteryForChild(
  childId: string,
  ageMode: AgeMode,
  db?: DbClient,
): Promise<void> {
  const d = defaultDb(db);
  const tracks: Track[] = ['literasi', 'math'];

  const [allLevels, progressRows, masteryRows] = await Promise.all([
    d.levelDefinition.findMany({
      where: { ageMode },
      orderBy: [{ track: 'asc' }, { order: 'asc' }],
      include: { activities: { select: { id: true } } },
    }),
    d.progress.findMany({
      where: { childId },
      select: { activityId: true, bestStars: true },
    }),
    d.levelMastery.findMany({ where: { childId } }),
  ]);

  const progressMap = new Map(
    progressRows.map((p) => [p.activityId, p.bestStars]),
  );
  const masteryMap = new Map(masteryRows.map((m) => [m.levelId, m]));

  const levelsByTrack = (t: Track) =>
    allLevels.filter((l) => l.track === t).sort((a, b) => a.order - b.order);

  for (const track of tracks) {
    const levels = levelsByTrack(track);

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const activityIds = level.activities.map((a) => a.id);

      let allGe3 = activityIds.length > 0;
      for (const id of activityIds) {
        const s = progressMap.get(id) ?? 0;
        if (s < 3) allGe3 = false;
      }
      if (activityIds.length === 0) {
        allGe3 = true;
      }

      let isUnlocked = level.order === 1;
      if (!isUnlocked && i > 0) {
        const prev = levels[i - 1];
        const prevIds = prev.activities.map((a) => a.id);
        let prevAllGe2 = prevIds.length > 0;
        for (const id of prevIds) {
          if ((progressMap.get(id) ?? 0) < 2) prevAllGe2 = false;
        }
        if (prevIds.length === 0) prevAllGe2 = true;
        isUnlocked = prevAllGe2;
      }

      const isMastered = allGe3;
      const existing = masteryMap.get(level.id);

      await d.levelMastery.upsert({
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
    }
  }
}
