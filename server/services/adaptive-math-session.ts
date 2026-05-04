import type { DbClient } from '../db-client';
import { defaultDb } from '../db-client';

/** Batas soal per sesi (PRD §3.5 + adaptive §4.1). */
export const MATH_SESSION_MIN = 5;
export const MATH_SESSION_MAX = 10;

export function clampMathSessionQuestionCount(n: number): number {
  return Math.min(MATH_SESSION_MAX, Math.max(MATH_SESSION_MIN, Math.round(n)));
}

/**
 * Rata-rata bintang **5 permainan terakhir** di jalur matematika → jumlah soal sesi (5–10).
 */
export async function computeMathSessionQuestionCount(
  childId: string,
  db?: DbClient,
): Promise<number> {
  const d = defaultDb(db);
  const recent = await d.progress.findMany({
    where: { childId, activity: { level: { track: 'math' } } },
    orderBy: { lastPlayedAt: 'desc' },
    take: 5,
    select: { bestStars: true },
  });
  if (recent.length === 0) return 6;
  const avg =
    recent.reduce((s, p) => s + p.bestStars, 0) / Math.max(1, recent.length);
  if (avg >= 2.7) return clampMathSessionQuestionCount(10);
  if (avg >= 2.4) return 9;
  if (avg >= 2.0) return 8;
  if (avg >= 1.6) return 7;
  if (avg >= 1.2) return 6;
  return MATH_SESSION_MIN;
}
