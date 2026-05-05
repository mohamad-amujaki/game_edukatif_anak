import { type DbClient, defaultDb } from '../db-client';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Panggil setelah aktivitas selesai. Return { streakBonus: boolean } jika hari ini pertama kali main.
 */
export async function updateStreakAfterPlay(
  childId: string,
  db?: DbClient,
): Promise<{ streakBonus: boolean }> {
  const d = defaultDb(db);
  const today = todayKey();
  const streak = await d.dailyStreak.findUnique({ where: { childId } });

  if (!streak) {
    await d.dailyStreak.create({
      data: {
        childId,
        currentStreak: 1,
        longestStreak: 1,
        lastPlayedDate: today,
      },
    });
    return { streakBonus: true };
  }

  if (streak.lastPlayedDate === today) {
    return { streakBonus: false };
  }

  const last = streak.lastPlayedDate;
  const yesterday = addDays(today, -1);
  let newStreak: number;
  if (last === yesterday) {
    newStreak = streak.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const longest = Math.max(streak.longestStreak, newStreak);

  await d.dailyStreak.update({
    where: { childId },
    data: {
      currentStreak: newStreak,
      longestStreak: longest,
      lastPlayedDate: today,
    },
  });

  return { streakBonus: true };
}
