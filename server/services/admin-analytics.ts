import { prisma } from '../db';

/** YYYY-MM-DD (UTC) untuk cocok dengan `PlaySession.dateKey` dari seed/gameplay. */
function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type LevelCompletionRow = {
  levelId: string;
  title: string;
  track: string;
  ageMode: string;
  order: number;
  mastered: number;
  eligibleChildren: number;
  masteredPct: number;
};

export type AvgStarsActivityRow = {
  activityId: string;
  title: string;
  avgStars: number;
  attempts: number;
};

export type AdminAnalyticsBundle = {
  totalAnak: number;
  totalSessions: number;
  dauToday: number;
  mau30d: number;
  retentionD1Pct: number | null;
  retentionD7Pct: number | null;
  retentionCohortD1: number;
  retentionCohortD7: number;
  totalPlayTimeMinutes: number;
  avgStarsGlobal: number;
  levelCompletion: LevelCompletionRow[];
  avgStarsByActivity: AvgStarsActivityRow[];
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

/**
 * Metrik MVP sesuai PRD §7:
 * - DAU / MAU (PlaySession + fallback Progress.lastPlayedAt)
 * - Retensi D1 / D7 (kohort ChildProfile.createdAt vs Progress.lastPlayedAt)
 * - Penyelesaian per level (LevelMastery.isMastered vs jumlah anak mode sama)
 * - Rata-rata bintang per aktivitas
 * - Total waktu bermain (PlaySession.durationSec)
 */
export async function computeAdminAnalytics(): Promise<AdminAnalyticsBundle> {
  const totalAnak = await prisma.childProfile.count();
  const totalSessions = await prisma.playSession.count();

  const todayKey = utcDateKey(new Date());
  const dauFromSessions = await prisma.playSession.groupBy({
    by: ['childId'],
    where: { dateKey: todayKey },
  });
  const startToday = startOfUtcDay(new Date());
  const endToday = addDays(startToday, 1);
  const dauFromProgress = await prisma.progress.groupBy({
    by: ['childId'],
    where: {
      lastPlayedAt: { gte: startToday, lt: endToday },
    },
  });
  const dauSet = new Set([
    ...dauFromSessions.map((r) => r.childId),
    ...dauFromProgress.map((r) => r.childId),
  ]);
  const dauToday = dauSet.size;

  const since30 = new Date();
  since30.setUTCDate(since30.getUTCDate() - 30);
  const mauSessions = await prisma.playSession.groupBy({
    by: ['childId'],
    where: { startedAt: { gte: since30 } },
  });
  const mauProgress = await prisma.progress.groupBy({
    by: ['childId'],
    where: { lastPlayedAt: { gte: since30 } },
  });
  const mauSet = new Set([
    ...mauSessions.map((r) => r.childId),
    ...mauProgress.map((r) => r.childId),
  ]);
  const mau30d = mauSet.size;

  const avgAgg = await prisma.progress.aggregate({
    _avg: { bestStars: true },
  });
  const avgStarsGlobal = Math.round((avgAgg._avg.bestStars ?? 0) * 10) / 10;

  const playSum = await prisma.playSession.aggregate({
    _sum: { durationSec: true },
  });
  const totalPlayTimeMinutes = Math.round((playSum._sum.durationSec ?? 0) / 60);

  const now = new Date();
  const cohortD1 = await prisma.childProfile.findMany({
    where: { createdAt: { lte: addDays(now, -2) } },
    select: { id: true, createdAt: true },
  });
  const cohortD7 = await prisma.childProfile.findMany({
    where: { createdAt: { lte: addDays(now, -8) } },
    select: { id: true, createdAt: true },
  });

  const allProgress = await prisma.progress.findMany({
    select: { childId: true, lastPlayedAt: true },
  });
  const byChild = new Map<string, Date[]>();
  for (const p of allProgress) {
    const arr = byChild.get(p.childId) ?? [];
    arr.push(p.lastPlayedAt);
    byChild.set(p.childId, arr);
  }

  function retentionPct(
    cohort: { id: string; createdAt: Date }[],
    daysAfter: number,
  ): { pct: number | null; n: number } {
    if (cohort.length === 0) return { pct: null, n: 0 };
    let ok = 0;
    for (const c of cohort) {
      const threshold = addDays(c.createdAt, daysAfter);
      const dates = byChild.get(c.id);
      if (!dates) continue;
      if (dates.some((d) => d >= threshold)) ok++;
    }
    return {
      pct: Math.round((1000 * ok) / cohort.length) / 10,
      n: cohort.length,
    };
  }

  const r1 = retentionPct(cohortD1, 1);
  const r7 = retentionPct(cohortD7, 7);

  const levels = await prisma.levelDefinition.findMany({
    orderBy: [{ ageMode: 'asc' }, { track: 'asc' }, { order: 'asc' }],
  });
  const countsByAge = await prisma.childProfile.groupBy({
    by: ['ageMode'],
    _count: { id: true },
  });
  const eligibleMap = Object.fromEntries(
    countsByAge.map((x) => [x.ageMode, x._count.id]),
  ) as Record<string, number>;

  const masteredByLevel = await prisma.levelMastery.groupBy({
    by: ['levelId'],
    where: { isMastered: true },
    _count: { id: true },
  });
  const masteredMap = new Map(
    masteredByLevel.map((m) => [m.levelId, m._count.id]),
  );

  const levelCompletion: LevelCompletionRow[] = levels.map((lv) => {
    const eligible = eligibleMap[lv.ageMode] ?? 0;
    const mastered = masteredMap.get(lv.id) ?? 0;
    const masteredPct =
      eligible > 0 ? Math.round((1000 * mastered) / eligible) / 10 : 0;
    return {
      levelId: lv.id,
      title: lv.title,
      track: lv.track,
      ageMode: lv.ageMode,
      order: lv.order,
      mastered,
      eligibleChildren: eligible,
      masteredPct,
    };
  });

  const starGroups = await prisma.progress.groupBy({
    by: ['activityId'],
    _avg: { bestStars: true },
    _count: { id: true },
  });
  const actIds = starGroups.map((s) => s.activityId);
  const actTitles =
    actIds.length === 0
      ? []
      : await prisma.activityDefinition.findMany({
          where: { id: { in: actIds } },
          select: { id: true, title: true },
        });
  const titleMap = new Map(actTitles.map((a) => [a.id, a.title]));

  const avgStarsByActivity: AvgStarsActivityRow[] = starGroups
    .map((g) => ({
      activityId: g.activityId,
      title: titleMap.get(g.activityId) ?? g.activityId,
      avgStars: Math.round((g._avg.bestStars ?? 0) * 10) / 10,
      attempts: g._count.id,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  return {
    totalAnak,
    totalSessions,
    dauToday,
    mau30d,
    retentionD1Pct: r1.pct,
    retentionD7Pct: r7.pct,
    retentionCohortD1: r1.n,
    retentionCohortD7: r7.n,
    totalPlayTimeMinutes,
    avgStarsGlobal,
    levelCompletion,
    avgStarsByActivity,
  };
}

/** Alias untuk cache typed di admin router */
export type AnalyticsSnapshot = AdminAnalyticsBundle;

const BUNDLE_TTL_MS = 5 * 60 * 1000;
let bundleCache: { data: AdminAnalyticsBundle; ts: number } | null = null;

export async function getAdminAnalyticsCached(): Promise<{
  data: AdminAnalyticsBundle;
  cached: boolean;
}> {
  if (bundleCache && Date.now() - bundleCache.ts < BUNDLE_TTL_MS) {
    return { data: bundleCache.data, cached: true };
  }
  const data = await computeAdminAnalytics();
  bundleCache = { data, ts: Date.now() };
  return { data, cached: false };
}

export function invalidateAdminAnalyticsCache(): void {
  bundleCache = null;
}
