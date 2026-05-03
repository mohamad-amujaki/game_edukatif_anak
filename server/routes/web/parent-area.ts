import type { Track } from '@prisma/client';
import { Hono } from 'hono';
import { prisma } from '../../db';
import { createParentSession } from '../../parent-session';
import { hashAnswer, hashPin, verifyPin } from '../../pin';
import {
  changePinSchema,
  setupPinSchema,
  verifyPinSchema,
} from '../../schemas';
import { jsonErr, parentGuard } from './shared';

/** PIN orang tua, pengaturan perangkat, laporan — dipasang di `web/index`. */
export const parentAreaApp = new Hono();

parentAreaApp.get('/api/parent/pin-status', async (c) => {
  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({ data: { pinIsSet: Boolean(settings?.pinHash) } });
});

parentAreaApp.post('/api/parent/setup-pin', async (c) => {
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

  const token = createParentSession();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return c.json(
    { data: { ok: true as const, sessionToken: token, expiresAt } },
    201,
  );
});

parentAreaApp.post('/api/parent/change-pin', async (c) => {
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

  const token = createParentSession();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return c.json(
    { data: { ok: true as const, sessionToken: token, expiresAt } },
    200,
  );
});

parentAreaApp.post('/api/parent/verify-pin', async (c) => {
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

  const token = createParentSession();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return c.json({ data: { sessionToken: token, expiresAt } });
});

parentAreaApp.get('/api/parent/settings', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!parentGuard(token))
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
    },
  });
});

parentAreaApp.put('/api/parent/settings', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!parentGuard(token))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const body = await c.req.json().catch(() => ({}));
  const updated = await prisma.parentSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      dailyTimeCapMinutes: Number(body.dailyTimeCapMinutes) || 30,
      breakReminderMinutes: Number(body.breakReminderMinutes) || 15,
      musicEnabled: Boolean(body.musicEnabled ?? true),
      sfxEnabled: Boolean(body.sfxEnabled ?? true),
      reduceMotion: Boolean(body.reduceMotion ?? false),
    },
    update: {
      ...(typeof body.dailyTimeCapMinutes === 'number'
        ? { dailyTimeCapMinutes: body.dailyTimeCapMinutes }
        : {}),
      ...(typeof body.breakReminderMinutes === 'number'
        ? { breakReminderMinutes: body.breakReminderMinutes }
        : {}),
      ...(typeof body.musicEnabled === 'boolean'
        ? { musicEnabled: body.musicEnabled }
        : {}),
      ...(typeof body.sfxEnabled === 'boolean'
        ? { sfxEnabled: body.sfxEnabled }
        : {}),
      ...(typeof body.reduceMotion === 'boolean'
        ? { reduceMotion: body.reduceMotion }
        : {}),
    },
  });

  return c.json({
    data: {
      dailyTimeCapMinutes: updated.dailyTimeCapMinutes,
      breakReminderMinutes: updated.breakReminderMinutes,
      musicEnabled: updated.musicEnabled,
      sfxEnabled: updated.sfxEnabled,
      reduceMotion: updated.reduceMotion,
    },
  });
});

parentAreaApp.get('/api/parent/report/:childId', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!parentGuard(token))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const childId = c.req.param('childId');
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  const xp = await prisma.xpLog.aggregate({
    where: { childId },
    _sum: { amount: true },
  });
  const prog = await prisma.progress.findMany({ where: { childId } });
  const totalStars = prog.reduce((a, p) => a + p.bestStars, 0);
  const activityDone = prog.filter((p) => p.firstCompletedAt).length;
  const streak = await prisma.dailyStreak.findUnique({ where: { childId } });

  const tracks: Track[] = ['literasi', 'math'];
  const perTrack = [];
  for (const track of tracks) {
    const masterCount = await prisma.levelMastery.count({
      where: {
        childId,
        isMastered: true,
        level: { track, ageMode: child.ageMode },
      },
    });
    const acts = await prisma.activityDefinition.findMany({
      where: { level: { track, ageMode: child.ageMode } },
    });
    const doneActs = await prisma.progress.count({
      where: {
        childId,
        activityId: { in: acts.map((a) => a.id) },
        firstCompletedAt: { not: null },
      },
    });
    const starsIn = prog.filter((p) => acts.some((a) => a.id === p.activityId));
    const avg =
      starsIn.length === 0
        ? 0
        : starsIn.reduce((s, p) => s + p.bestStars, 0) / starsIn.length;

    perTrack.push({
      track,
      levelsMastered: masterCount,
      activitiesCompleted: doneActs,
      averageStars: Math.round(avg * 10) / 10,
    });
  }

  const badges = await prisma.earnedBadge.findMany({
    where: { childId },
    orderBy: { earnedAt: 'desc' },
    take: 10,
    include: { badge: true },
  });

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
      recentBadges: badges.map((b) => ({
        name: b.badge.name,
        iconPath: b.badge.iconPath,
        earnedAt: b.earnedAt.toISOString(),
      })),
      dailyTimeline: [],
    },
  });
});
