import { timingSafeEqual } from 'node:crypto';
import type { Track } from '@prisma/client';
import type { Context } from 'hono';
import { Hono } from 'hono';
import {
  adoptOrphanGuestProfiles,
  gateChildProfileForKidAppOrJson,
  isParentAppRole,
  sessionUserFromCookies,
} from '../../child-access';
import { prisma } from '../../db';
import { ensureGuestBindingCookie } from '../../guest-binding';
import { createParentSession } from '../../parent-session';
import { hashAnswer, hashPin, verifyAnswer, verifyPin } from '../../pin';
import { createRateLimiter } from '../../rate-limit';
import { hashRecoveryToken, newRecoveryToken } from '../../recovery-token';
import {
  changePinSchema,
  parentSettingsPatchSchema,
  resetPinRecoverySchema,
  setupPinSchema,
  verifyPinSchema,
  verifyRecoverySchema,
} from '../../schemas';
import { jsonErr, parentGuard } from './shared';

/** PIN orang tua, pengaturan perangkat, laporan — dipasang di `web/index`. */
export const parentAreaApp = new Hono();

const ratePinVerify = createRateLimiter({
  key: 'parent-verify-pin',
  limit: 24,
  windowMs: 15 * 60 * 1000,
});
const ratePinSetup = createRateLimiter({
  key: 'parent-setup-pin',
  limit: 12,
  windowMs: 60 * 60 * 1000,
});
const ratePinChange = createRateLimiter({
  key: 'parent-change-pin',
  limit: 12,
  windowMs: 60 * 60 * 1000,
});
const rateRecoveryVerify = createRateLimiter({
  key: 'parent-recovery-verify',
  limit: 10,
  windowMs: 60 * 60 * 1000,
});
const rateRecoveryReset = createRateLimiter({
  key: 'parent-recovery-reset',
  limit: 6,
  windowMs: 60 * 60 * 1000,
});

function maskParentEmail(email: string): string {
  const [u, d] = email.split('@');
  if (!d || !u) return '***';
  return `${u.slice(0, Math.min(2, u.length))}***@${d}`;
}

async function allowParentSessionOrAccount(
  c: Context,
  sessionToken: string | undefined,
): Promise<boolean> {
  if (await parentGuard(sessionToken)) return true;
  const u = await sessionUserFromCookies(c);
  return Boolean(u && isParentAppRole(u.role));
}

parentAreaApp.get('/api/parent/pin-status', async (c) => {
  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({ data: { pinIsSet: Boolean(settings?.pinHash) } });
});

parentAreaApp.post('/api/parent/setup-pin', ratePinSetup, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = setupPinSchema.safeParse(body);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (settings?.pinHash) return jsonErr('CONFLICT', 'PIN sudah diatur', 409);

  const pinHash = await hashPin(parsed.data.pin);
  const answerHash = await hashAnswer(parsed.data.recoveryAnswer);

  await prisma.parentSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      pinHash,
      pinSetupQuestion: parsed.data.recoveryQuestion,
      pinSetupAnswerHash: answerHash,
    },
    update: {
      pinHash,
      pinSetupQuestion: parsed.data.recoveryQuestion,
      pinSetupAnswerHash: answerHash,
    },
  });

  const token = await createParentSession();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return c.json(
    { data: { ok: true as const, sessionToken: token, expiresAt } },
    201,
  );
});

parentAreaApp.post('/api/parent/change-pin', ratePinChange, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = changePinSchema.safeParse(body);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings?.pinHash)
    return jsonErr('PIN_NOT_SET', 'PIN belum diatur', 400);

  const oldOk = await verifyPin(parsed.data.currentPin, settings.pinHash);
  if (!oldOk) return jsonErr('PIN_INCORRECT', 'PIN lama salah', 403);

  const pinHash = await hashPin(parsed.data.pin);
  const answerHash = await hashAnswer(parsed.data.recoveryAnswer);

  await prisma.parentSettings.update({
    where: { id: 'singleton' },
    data: {
      pinHash,
      pinSetupQuestion: parsed.data.recoveryQuestion,
      pinSetupAnswerHash: answerHash,
    },
  });

  const token = await createParentSession();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return c.json(
    { data: { ok: true as const, sessionToken: token, expiresAt } },
    200,
  );
});

parentAreaApp.post('/api/parent/verify-pin', ratePinVerify, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = verifyPinSchema.safeParse(body);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings?.pinHash)
    return jsonErr('PIN_NOT_SET', 'PIN belum diatur', 400);

  const ok = await verifyPin(parsed.data.pin, settings.pinHash);
  if (!ok) return jsonErr('PIN_INCORRECT', 'PIN salah', 403);

  const token = await createParentSession();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return c.json({ data: { sessionToken: token, expiresAt } });
});

parentAreaApp.get('/api/parent/recovery-question', async (c) => {
  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings?.pinHash || !settings.pinSetupQuestion)
    return jsonErr('PIN_NOT_SET', 'PIN belum diatur', 400);
  return c.json({
    data: { question: settings.pinSetupQuestion },
  });
});

parentAreaApp.post(
  '/api/parent/verify-recovery',
  rateRecoveryVerify,
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = verifyRecoverySchema.safeParse(body);
    if (!parsed.success)
      return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

    const settings = await prisma.parentSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings?.pinHash || !settings.pinSetupAnswerHash)
      return jsonErr('PIN_NOT_SET', 'PIN belum diatur', 400);

    const ok = await verifyAnswer(
      parsed.data.recoveryAnswer,
      settings.pinSetupAnswerHash,
    );
    if (!ok)
      return jsonErr('RECOVERY_INCORRECT', 'Jawaban pemulihan salah', 403);

    const token = newRecoveryToken();
    const tokenHash = hashRecoveryToken(token);
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.parentSettings.update({
      where: { id: 'singleton' },
      data: {
        pinRecoveryTokenHash: tokenHash,
        pinRecoveryTokenExpires: expires,
      },
    });

    return c.json({
      data: {
        recoveryToken: token,
        recoveryTokenExpiresAt: expires.toISOString(),
      },
    });
  },
);

parentAreaApp.post(
  '/api/parent/reset-pin-with-recovery',
  rateRecoveryReset,
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = resetPinRecoverySchema.safeParse(body);
    if (!parsed.success)
      return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

    const settings = await prisma.parentSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings?.pinRecoveryTokenHash || !settings.pinRecoveryTokenExpires)
      return jsonErr('RECOVERY_EXPIRED', 'Token pemulihan tidak valid', 400);
    if (settings.pinRecoveryTokenExpires.getTime() < Date.now())
      return jsonErr('RECOVERY_EXPIRED', 'Token pemulihan kedaluwarsa', 400);

    const want = hashRecoveryToken(parsed.data.recoveryToken);
    const got = settings.pinRecoveryTokenHash;
    const a = Buffer.from(want, 'utf8');
    const b = Buffer.from(got, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b))
      return jsonErr('RECOVERY_INCORRECT', 'Token pemulihan tidak valid', 403);

    const pinHash = await hashPin(parsed.data.pin);
    const answerHash = await hashAnswer(parsed.data.recoveryAnswer);

    await prisma.parentSettings.update({
      where: { id: 'singleton' },
      data: {
        pinHash,
        pinSetupQuestion: parsed.data.recoveryQuestion,
        pinSetupAnswerHash: answerHash,
        pinRecoveryTokenHash: null,
        pinRecoveryTokenExpires: null,
      },
    });

    const sessionToken = await createParentSession();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    return c.json(
      { data: { ok: true as const, sessionToken, expiresAt } },
      200,
    );
  },
);

parentAreaApp.get('/api/parent/settings', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!(await allowParentSessionOrAccount(c, token)))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const s = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({
    data: {
      dailyTimeCapMinutes: s?.dailyTimeCapMinutes ?? 30,
      breakReminderMinutes: s?.breakReminderMinutes ?? 15,
      musicEnabled: s?.musicEnabled ?? true,
      sfxEnabled: s?.sfxEnabled ?? true,
      reduceMotion: s?.reduceMotion ?? false,
      isSuperParent: s?.isSuperParent ?? false,
      parentEmailMasked:
        s?.parentEmail?.includes('@') === true
          ? maskParentEmail(s.parentEmail)
          : null,
      weeklyEmailOptIn: s?.weeklyEmailOptIn ?? false,
    },
  });
});

parentAreaApp.put('/api/parent/settings', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!(await allowParentSessionOrAccount(c, token)))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const raw = await c.req.json().catch(() => ({}));
  const parsed = parentSettingsPatchSchema.safeParse(raw);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);
  const patch = parsed.data;

  const emailUpdate =
    patch.parentEmail === undefined
      ? {}
      : {
          parentEmail:
            patch.parentEmail === '' || patch.parentEmail === null
              ? null
              : patch.parentEmail,
        };

  const updated = await prisma.parentSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      dailyTimeCapMinutes: patch.dailyTimeCapMinutes ?? 30,
      breakReminderMinutes: patch.breakReminderMinutes ?? 15,
      musicEnabled: patch.musicEnabled ?? true,
      sfxEnabled: patch.sfxEnabled ?? true,
      reduceMotion: patch.reduceMotion ?? false,
      weeklyEmailOptIn: patch.weeklyEmailOptIn ?? false,
      ...emailUpdate,
    },
    update: {
      ...(patch.dailyTimeCapMinutes !== undefined
        ? { dailyTimeCapMinutes: patch.dailyTimeCapMinutes }
        : {}),
      ...(patch.breakReminderMinutes !== undefined
        ? { breakReminderMinutes: patch.breakReminderMinutes }
        : {}),
      ...(patch.musicEnabled !== undefined
        ? { musicEnabled: patch.musicEnabled }
        : {}),
      ...(patch.sfxEnabled !== undefined
        ? { sfxEnabled: patch.sfxEnabled }
        : {}),
      ...(patch.reduceMotion !== undefined
        ? { reduceMotion: patch.reduceMotion }
        : {}),
      ...(patch.weeklyEmailOptIn !== undefined
        ? { weeklyEmailOptIn: patch.weeklyEmailOptIn }
        : {}),
      ...emailUpdate,
    },
  });

  return c.json({
    data: {
      dailyTimeCapMinutes: updated.dailyTimeCapMinutes,
      breakReminderMinutes: updated.breakReminderMinutes,
      musicEnabled: updated.musicEnabled,
      sfxEnabled: updated.sfxEnabled,
      reduceMotion: updated.reduceMotion,
      parentEmailMasked:
        updated.parentEmail?.includes('@') === true
          ? maskParentEmail(updated.parentEmail)
          : null,
      weeklyEmailOptIn: updated.weeklyEmailOptIn,
    },
  });
});

parentAreaApp.get('/api/parent/dashboard', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!(await allowParentSessionOrAccount(c, token)))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const user = await sessionUserFromCookies(c);
  const children = await (async () => {
    if (user && isParentAppRole(user.role)) {
      return prisma.childProfile.findMany({
        where: { ownerUserId: user.id },
        orderBy: { createdAt: 'asc' },
      });
    }
    // Fallback untuk mode tamu + sesi PIN di perangkat ini.
    const binding = ensureGuestBindingCookie(c);
    await adoptOrphanGuestProfiles(binding);
    return prisma.childProfile.findMany({
      where: { ownerUserId: null, guestBindingId: binding },
      orderBy: { createdAt: 'asc' },
    });
  })();

  if (children.length === 0) {
    return c.json({
      data: {
        totalChildren: 0,
        activeChildren7d: 0,
        retention7dPct: 0,
        totalActivitiesCompleted: 0,
        totalPlayMinutes: 0,
        averageStars: 0,
        levelCompletionPct: 0,
        perTrack: [] as Array<{ track: Track; averageStars: number }>,
        childSummaries: [] as Array<Record<string, unknown>>,
      },
    });
  }

  const childIds = children.map((cRow) => cRow.id);
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const sevenDateKey = sevenDaysAgo.toISOString().slice(0, 10);

  const [progressRows, playRows, levelMasteredRows, xpRows, levelDefs] =
    await Promise.all([
      prisma.progress.findMany({
        where: { childId: { in: childIds } },
        select: {
          childId: true,
          bestStars: true,
          firstCompletedAt: true,
          activity: { select: { level: { select: { track: true } } } },
        },
      }),
      prisma.playSession.findMany({
        where: { childId: { in: childIds } },
        select: { childId: true, durationSec: true, dateKey: true },
      }),
      prisma.levelMastery.findMany({
        where: { childId: { in: childIds }, isMastered: true },
        select: { childId: true },
      }),
      prisma.xpLog.groupBy({
        by: ['childId'],
        where: { childId: { in: childIds } },
        _sum: { amount: true },
      }),
      prisma.levelDefinition.groupBy({
        by: ['ageMode'],
        _count: { id: true },
      }),
    ]);

  const totalLevelByAge = new Map(
    levelDefs.map((r) => [r.ageMode, r._count.id ?? 0]),
  );
  const xpByChild = new Map(xpRows.map((r) => [r.childId, r._sum.amount ?? 0]));
  const progressByChild = new Map<string, typeof progressRows>();
  const playByChild = new Map<string, typeof playRows>();
  const masteredCountByChild = new Map<string, number>();

  for (const row of progressRows) {
    const list = progressByChild.get(row.childId) ?? [];
    list.push(row);
    progressByChild.set(row.childId, list);
  }
  for (const row of playRows) {
    const list = playByChild.get(row.childId) ?? [];
    list.push(row);
    playByChild.set(row.childId, list);
  }
  for (const row of levelMasteredRows) {
    masteredCountByChild.set(
      row.childId,
      (masteredCountByChild.get(row.childId) ?? 0) + 1,
    );
  }

  let totalActivitiesCompleted = 0;
  let totalPlayMinutes = 0;
  let allStarsSum = 0;
  let allStarsCount = 0;
  let activeChildren7d = 0;
  let eligibleRetention = 0;
  let retainedChildren7d = 0;
  let masteredAllChildren = 0;
  let totalLevelsAllChildren = 0;
  const trackStars: Record<Track, { sum: number; count: number }> = {
    literasi: { sum: 0, count: 0 },
    math: { sum: 0, count: 0 },
  };

  const childSummaries = children.map((child) => {
    const childProgress = progressByChild.get(child.id) ?? [];
    const childPlay = playByChild.get(child.id) ?? [];

    const childActivitiesCompleted = childProgress.filter(
      (p) => p.firstCompletedAt,
    ).length;
    const childPlayMinutes = Math.round(
      childPlay.reduce((acc, row) => acc + row.durationSec, 0) / 60,
    );
    const childStarsSum = childProgress.reduce(
      (acc, p) => acc + p.bestStars,
      0,
    );
    const childAvgStars =
      childProgress.length === 0
        ? 0
        : Math.round((childStarsSum / childProgress.length) * 10) / 10;
    const childMastered = masteredCountByChild.get(child.id) ?? 0;
    const childTotalLevels = totalLevelByAge.get(child.ageMode) ?? 0;
    const childCompletionPct =
      childTotalLevels === 0
        ? 0
        : Math.round((childMastered / childTotalLevels) * 100);
    const childActive7d = childPlay.some((s) => s.dateKey >= sevenDateKey);

    totalActivitiesCompleted += childActivitiesCompleted;
    totalPlayMinutes += childPlayMinutes;
    allStarsSum += childStarsSum;
    allStarsCount += childProgress.length;
    if (childActive7d) activeChildren7d += 1;
    if (child.createdAt <= sevenDaysAgo) {
      eligibleRetention += 1;
      if (childActive7d) retainedChildren7d += 1;
    }
    masteredAllChildren += childMastered;
    totalLevelsAllChildren += childTotalLevels;

    for (const p of childProgress) {
      const track = p.activity.level.track;
      trackStars[track].sum += p.bestStars;
      trackStars[track].count += 1;
    }

    return {
      id: child.id,
      name: child.name,
      ageMode: child.ageMode,
      createdAt: child.createdAt.toISOString(),
      totalXp: xpByChild.get(child.id) ?? 0,
      totalActivitiesCompleted: childActivitiesCompleted,
      totalPlayMinutes: childPlayMinutes,
      averageStars: childAvgStars,
      active7d: childActive7d,
      levelCompletionPct: childCompletionPct,
    };
  });

  const perTrack: Array<{ track: Track; averageStars: number }> = [
    {
      track: 'literasi',
      averageStars:
        trackStars.literasi.count === 0
          ? 0
          : Math.round(
              (trackStars.literasi.sum / trackStars.literasi.count) * 10,
            ) / 10,
    },
    {
      track: 'math',
      averageStars:
        trackStars.math.count === 0
          ? 0
          : Math.round((trackStars.math.sum / trackStars.math.count) * 10) / 10,
    },
  ];

  const retention7dPct =
    eligibleRetention === 0
      ? 0
      : Math.round((retainedChildren7d / eligibleRetention) * 100);
  const levelCompletionPct =
    totalLevelsAllChildren === 0
      ? 0
      : Math.round((masteredAllChildren / totalLevelsAllChildren) * 100);

  return c.json({
    data: {
      totalChildren: children.length,
      activeChildren7d,
      retention7dPct,
      totalActivitiesCompleted,
      totalPlayMinutes,
      averageStars:
        allStarsCount === 0
          ? 0
          : Math.round((allStarsSum / allStarsCount) * 10) / 10,
      levelCompletionPct,
      perTrack,
      childSummaries,
    },
  });
});

parentAreaApp.get('/api/parent/report/:childId', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!(await allowParentSessionOrAccount(c, token)))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const childId = c.req.param('childId');
  const gated = await gateChildProfileForKidAppOrJson(c, childId);
  if (gated instanceof Response) return gated;
  const child = gated;

  const [xp, prog, streak, actRows, masterRows, badges] = await Promise.all([
    prisma.xpLog.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
    prisma.progress.findMany({
      where: { childId },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            level: { select: { track: true } },
          },
        },
      },
      orderBy: [{ bestStars: 'asc' }, { lastPlayedAt: 'desc' }],
    }),
    prisma.dailyStreak.findUnique({ where: { childId } }),
    prisma.activityDefinition.findMany({
      where: { level: { ageMode: child.ageMode } },
      select: { id: true, level: { select: { track: true } } },
    }),
    prisma.levelMastery.findMany({
      where: {
        childId,
        isMastered: true,
        level: { ageMode: child.ageMode },
      },
      include: { level: { select: { track: true } } },
    }),
    prisma.earnedBadge.findMany({
      where: { childId },
      orderBy: { earnedAt: 'desc' },
      take: 10,
      include: { badge: true },
    }),
  ]);

  const totalStars = prog.reduce((a, p) => a + p.bestStars, 0);
  const activityDone = prog.filter((p) => p.firstCompletedAt).length;

  const tracks: Track[] = ['literasi', 'math'];
  const masteredByTrack: Record<Track, number> = {
    literasi: 0,
    math: 0,
  };
  for (const m of masterRows) {
    masteredByTrack[m.level.track]++;
  }

  const perTrack = tracks.map((track) => {
    const actIds = new Set(
      actRows.filter((a) => a.level.track === track).map((a) => a.id),
    );
    const starsIn = prog.filter((p) => actIds.has(p.activityId));
    const avg =
      starsIn.length === 0
        ? 0
        : starsIn.reduce((s, p) => s + p.bestStars, 0) / starsIn.length;
    const doneActs = prog.filter(
      (p) => actIds.has(p.activityId) && p.firstCompletedAt,
    ).length;
    return {
      track,
      levelsMastered: masteredByTrack[track],
      activitiesCompleted: doneActs,
      averageStars: Math.round(avg * 10) / 10,
    };
  });

  const replayRecommendations: Array<{
    activityId: string;
    title: string;
    track: Track;
    bestStars: number;
  }> = [];
  const seenRec = new Set<string>();
  for (const p of prog) {
    if (p.bestStars >= 3) continue;
    if (seenRec.has(p.activityId)) continue;
    seenRec.add(p.activityId);
    replayRecommendations.push({
      activityId: p.activity.id,
      title: p.activity.title,
      track: p.activity.level.track,
      bestStars: p.bestStars,
    });
    if (replayRecommendations.length >= 3) break;
  }

  if (replayRecommendations.length < 3) {
    const unlocked = await prisma.levelMastery.findMany({
      where: { childId, isUnlocked: true },
      select: { levelId: true },
    });
    const levelIds = [...new Set(unlocked.map((u) => u.levelId))];
    const moreActs = await prisma.activityDefinition.findMany({
      where: { levelId: { in: levelIds }, level: { ageMode: child.ageMode } },
      select: { id: true, title: true, level: { select: { track: true } } },
      orderBy: { order: 'asc' },
    });
    const progByAct = new Map(prog.map((row) => [row.activityId, row]));
    for (const a of moreActs) {
      if (replayRecommendations.length >= 3) break;
      if (seenRec.has(a.id)) continue;
      const pr = progByAct.get(a.id);
      const stars = pr?.bestStars ?? 0;
      if (stars >= 3) continue;
      seenRec.add(a.id);
      replayRecommendations.push({
        activityId: a.id,
        title: a.title,
        track: a.level.track,
        bestStars: stars,
      });
    }
  }

  return c.json({
    data: {
      child: {
        id: child.id,
        name: child.name,
        avatarKey: child.avatarKey,
        ageMode: child.ageMode,
        createdAt: child.createdAt.toISOString(),
      },
      totalXp: xp._sum.amount ?? 0,
      totalStars,
      totalActivitiesCompleted: activityDone,
      totalPlayMinutes: 0,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
      perTrack,
      replayRecommendations,
      recentBadges: badges.map((b) => ({
        name: b.badge.name,
        iconPath: b.badge.iconPath,
        earnedAt: b.earnedAt.toISOString(),
      })),
      dailyTimeline: [],
    },
  });
});
