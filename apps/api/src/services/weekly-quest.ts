import type { Rarity } from '@prisma/client';
import type { DbClient } from '../db-client';
import { defaultDb } from '../db-client';

const WEEKLY_ACTIVITY_TARGET = 10;
const WEEKLY_XP = 25;

/** Senin UTC sebagai kunci minggu (YYYY-MM-DD). */
export function utcMondayDateKey(d = new Date()): string {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dow = x.getUTCDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  x.setUTCDate(x.getUTCDate() + delta);
  return x.toISOString().slice(0, 10);
}

type WeeklySticker = {
  id: string;
  name: string;
  imagePath: string;
  rarity: string;
} | null;

async function maybeAwardWeeklyRareSticker(
  childId: string,
  db: DbClient,
): Promise<WeeklySticker> {
  const owned = await db.earnedSticker.findMany({
    where: { childId },
    select: { stickerId: true },
  });
  const ownedSet = new Set(owned.map((o) => o.stickerId));

  const order: Rarity[] = ['EPIC', 'RARE'];
  for (const rarity of order) {
    const pool = await db.stickerCatalog.findMany({
      where: {
        rarity,
        ...(ownedSet.size ? { id: { notIn: [...ownedSet] } } : {}),
      },
    });
    if (pool.length === 0) continue;
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    await db.earnedSticker.create({
      data: { childId, stickerId: pick.id },
    });
    return {
      id: pick.id,
      name: pick.name,
      imagePath: pick.imagePath,
      rarity: pick.rarity,
    };
  }
  return null;
}

/**
 * Quest mingguan: **10 aktivitas berbeda** selesai (≥1★) dalam minggu kalender (UTC, senin–minggu).
 * Bonus sekali per minggu: +25 XP + upaya stiker langka (EPIC/RARE).
 */
export async function syncAndAwardWeeklyQuestBonus(
  childId: string,
  activityId: string,
  stars: number,
  db?: DbClient,
): Promise<{ xp: number; sticker: WeeklySticker }> {
  const d = defaultDb(db);
  if (stars < 1) return { xp: 0, sticker: null };

  const weekStart = utcMondayDateKey();
  const row = await d.dailyStreak.findUnique({ where: { childId } });
  if (!row) return { xp: 0, sticker: null };

  let ids: string[] = [];
  if (row.weekQuestWeekStart !== weekStart) {
    ids = [activityId];
  } else {
    try {
      ids = row.weekQuestActivityIdsDone
        ? (JSON.parse(row.weekQuestActivityIdsDone) as string[])
        : [];
    } catch {
      ids = [];
    }
    if (!ids.includes(activityId)) ids.push(activityId);
  }

  const sameWeekAsStored = row.weekQuestWeekStart === weekStart;
  const alreadyAwardedThisWeek =
    sameWeekAsStored && row.weekQuestBonusWeekStart === weekStart;

  await d.dailyStreak.update({
    where: { childId },
    data: {
      weekQuestWeekStart: weekStart,
      weekQuestActivityIdsDone: JSON.stringify(ids),
      ...(row.weekQuestWeekStart !== weekStart
        ? { weekQuestBonusWeekStart: null }
        : {}),
    },
  });

  if (ids.length < WEEKLY_ACTIVITY_TARGET || alreadyAwardedThisWeek) {
    return { xp: 0, sticker: null };
  }

  await d.dailyStreak.update({
    where: { childId },
    data: { weekQuestBonusWeekStart: weekStart },
  });

  await d.xpLog.create({
    data: {
      childId,
      amount: WEEKLY_XP,
      source: 'WEEKLY_QUEST',
      refId: `weekly-${weekStart}`,
    },
  });

  const sticker = await maybeAwardWeeklyRareSticker(childId, d);
  return { xp: WEEKLY_XP, sticker };
}
