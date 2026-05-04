import type { AgeMode } from '@prisma/client';
import { type DbClient, defaultDb } from '../db-client';
import { getFirstNIncompleteUnlockedActivityIds } from './dashboard';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Quest harian = maks. 4 aktivitas unlocked yang belum selesai (sama urutan dashboard).
 * Set target per hari kalender (UTC, konsisten dengan `streak.ts`); jika semua target selesai, +15 XP sekali.
 */
export async function syncAndAwardDailyQuestBonus(
  childId: string,
  ageMode: AgeMode,
  db?: DbClient,
): Promise<number> {
  const d = defaultDb(db);
  const today = todayKey();
  const row = await d.dailyStreak.findUnique({ where: { childId } });
  if (!row) return 0;

  let targetIds: string[];
  if (row.questTargetDate !== today) {
    targetIds = await getFirstNIncompleteUnlockedActivityIds(
      childId,
      ageMode,
      4,
      d,
    );
    await d.dailyStreak.update({
      where: { childId },
      data: {
        questTargetDate: today,
        questTargetActivityIds: JSON.stringify(targetIds),
        questBonusDate: null,
      },
    });
  } else {
    try {
      targetIds = row.questTargetActivityIds
        ? (JSON.parse(row.questTargetActivityIds) as string[])
        : [];
    } catch {
      targetIds = [];
    }
  }

  if (targetIds.length === 0) return 0;

  const after = await d.dailyStreak.findUnique({ where: { childId } });
  if (after?.questBonusDate === today) return 0;

  const progresses = await d.progress.findMany({
    where: { childId, activityId: { in: targetIds } },
  });
  const pmap = new Map(progresses.map((p) => [p.activityId, p.bestStars]));
  if (!targetIds.every((id) => (pmap.get(id) ?? 0) >= 1)) return 0;

  await d.xpLog.create({
    data: {
      childId,
      amount: 15,
      source: 'DAILY_QUEST',
      refId: `quest-${today}`,
    },
  });
  await d.dailyStreak.update({
    where: { childId },
    data: { questBonusDate: today },
  });
  return 15;
}
