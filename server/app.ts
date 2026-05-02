import type { Track } from '@prisma/client';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { prisma } from './db';
import { createParentSession, isParentSessionValid } from './parent-session';
import { hashAnswer, hashPin, verifyPin } from './pin';
import {
  createProfileSchema,
  setupPinSchema,
  submitActivitySchema,
  updateProfileSchema,
  verifyPinSchema,
} from './schemas';
import { buildDashboard } from './services/dashboard';
import { initializeLevelMastery } from './services/mastery';
import { submitActivity } from './services/submit-activity';

type Env = {
  Variables: {
    parentSession?: string;
  };
};

const api = new Hono<{ Bindings: Env }>()
  .use(
    '*',
    cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }),
  )
  .use('*', prettyJSON());

function jsonErr(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

function parentGuard(sessionToken: string | undefined): boolean {
  return isParentSessionValid(sessionToken);
}

api.get('/api/health', (c) => c.json({ data: { ok: true } }));

api.get('/api/profiles', async (c) => {
  const list = await prisma.childProfile.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return c.json({
    data: list.map((p) => ({
      id: p.id,
      name: p.name,
      avatarKey: p.avatarKey,
      ageMode: p.ageMode,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

api.post('/api/profiles', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

  const count = await prisma.childProfile.count();
  if (count >= 4)
    return jsonErr('CONFLICT', 'Maksimal 4 profil per perangkat', 409);

  const profile = await prisma.childProfile.create({ data: parsed.data });
  await initializeLevelMastery(profile.id, profile.ageMode);

  return c.json(
    {
      data: {
        id: profile.id,
        name: profile.name,
        avatarKey: profile.avatarKey,
        ageMode: profile.ageMode,
        createdAt: profile.createdAt.toISOString(),
      },
    },
    201,
  );
});

api.patch('/api/profiles/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

  const exists = await prisma.childProfile.findUnique({ where: { id } });
  if (!exists) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  const updated = await prisma.childProfile.update({
    where: { id },
    data: parsed.data,
  });

  return c.json({
    data: {
      id: updated.id,
      name: updated.name,
      avatarKey: updated.avatarKey,
      ageMode: updated.ageMode,
      createdAt: updated.createdAt.toISOString(),
    },
  });
});

api.delete('/api/profiles/:id', async (c) => {
  const token = c.req.header('X-Parent-Session');
  if (!parentGuard(token))
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);

  const id = c.req.param('id');
  await prisma.childProfile.delete({ where: { id } }).catch(() => null);
  return c.body(null, 204);
});

api.get('/api/profiles/:id/dashboard', async (c) => {
  const id = c.req.param('id');
  const dash = await buildDashboard(id);
  if (!dash) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);
  return c.json({ data: dash });
});

api.get('/api/profiles/:id/levels', async (c) => {
  const childId = c.req.param('id');
  const trackQ = c.req.query('track') as Track | undefined;

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  const levels = await prisma.levelDefinition.findMany({
    where: {
      ageMode: child.ageMode,
      ...(trackQ ? { track: trackQ } : {}),
    },
    orderBy: [{ track: 'asc' }, { order: 'asc' }],
  });

  const out = [];
  for (const level of levels) {
    const mastery = await prisma.levelMastery.findUnique({
      where: { childId_levelId: { childId, levelId: level.id } },
    });
    const acts = await prisma.activityDefinition.findMany({
      where: { levelId: level.id },
    });
    const prog = await prisma.progress.findMany({
      where: { childId, activityId: { in: acts.map((a) => a.id) } },
    });
    const pmap = new Map(prog.map((p) => [p.activityId, p.bestStars]));
    const starsEarned = prog.reduce((s, p) => s + p.bestStars, 0);
    const starsMax = acts.length * 3;
    const done = acts.filter((a) => (pmap.get(a.id) ?? 0) >= 1).length;
    const progressPct =
      acts.length === 0 ? 0 : Math.round((done / acts.length) * 100);

    out.push({
      id: level.id,
      track: level.track,
      order: level.order,
      title: level.title,
      description: level.description,
      iconKey: level.iconKey,
      isUnlocked: mastery?.isUnlocked ?? false,
      isMastered: mastery?.isMastered ?? false,
      progressPct,
      activitiesCount: acts.length,
      starsEarned,
      starsMax,
    });
  }

  return c.json({ data: out });
});

api.get('/api/profiles/:childId/levels/:levelId', async (c) => {
  const childId = c.req.param('childId');
  const levelId = c.req.param('levelId');

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  const level = await prisma.levelDefinition.findUnique({
    where: { id: levelId },
  });
  if (!level || level.ageMode !== child.ageMode)
    return jsonErr('NOT_FOUND', 'Level tidak ada', 404);

  const mastery = await prisma.levelMastery.findUnique({
    where: { childId_levelId: { childId, levelId } },
  });
  if (!mastery?.isUnlocked) return jsonErr('NOT_FOUND', 'Level terkunci', 404);

  const acts = await prisma.activityDefinition.findMany({
    where: { levelId },
    orderBy: { order: 'asc' },
  });

  const prog = await prisma.progress.findMany({
    where: { childId, activityId: { in: acts.map((a) => a.id) } },
  });
  const pmap = new Map(prog.map((p) => [p.activityId, p]));

  const starsEarned = prog.reduce((s, p) => s + p.bestStars, 0);
  const starsMax = acts.length * 3;
  const done = acts.filter((a) => (pmap.get(a.id)?.bestStars ?? 0) >= 1).length;
  const progressPct =
    acts.length === 0 ? 0 : Math.round((done / acts.length) * 100);

  return c.json({
    data: {
      id: level.id,
      track: level.track,
      order: level.order,
      title: level.title,
      description: level.description,
      iconKey: level.iconKey,
      isUnlocked: true,
      isMastered: mastery.isMastered,
      progressPct,
      activitiesCount: acts.length,
      starsEarned,
      starsMax,
      activities: acts.map((a) => ({
        id: a.id,
        type: a.type,
        order: a.order,
        title: a.title,
        estimatedSec: a.estimatedSec,
        bestStars: pmap.get(a.id)?.bestStars ?? 0,
        isCompleted: (pmap.get(a.id)?.bestStars ?? 0) >= 1,
      })),
    },
  });
});

api.get('/api/activities/:id', async (c) => {
  const id = c.req.param('id');
  const act = await prisma.activityDefinition.findUnique({
    where: { id },
    include: { level: true },
  });
  if (!act) return jsonErr('NOT_FOUND', 'Aktivitas tidak ada', 404);

  const voice = JSON.parse(act.voiceOverKeys) as { instruksi: string };
  return c.json({
    data: {
      id: act.id,
      type: act.type,
      title: act.title,
      estimatedSec: act.estimatedSec,
      payload: JSON.parse(act.payload),
      voiceOverKeys: voice,
      level: {
        id: act.level.id,
        title: act.level.title,
        track: act.level.track,
      },
    },
  });
});

api.post('/api/profiles/:childId/activities/:activityId/submit', async (c) => {
  const childId = c.req.param('childId');
  const activityId = c.req.param('activityId');
  const body = await c.req.json().catch(() => null);
  const parsed = submitActivitySchema.safeParse(body);
  if (!parsed.success)
    return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  try {
    const result = await submitActivity({
      childId,
      activityId,
      mistakes: parsed.data.mistakes,
      durationSec: parsed.data.durationSec,
      score: parsed.data.score,
    });
    return c.json({ data: result });
  } catch {
    return jsonErr('NOT_FOUND', 'Aktivitas tidak ada', 404);
  }
});

api.post('/api/parent/setup-pin', async (c) => {
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

api.post('/api/parent/verify-pin', async (c) => {
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

api.get('/api/parent/settings', async (c) => {
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
    },
  });
});

api.put('/api/parent/settings', async (c) => {
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

api.get('/api/parent/report/:childId', async (c) => {
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

export const app = api;
