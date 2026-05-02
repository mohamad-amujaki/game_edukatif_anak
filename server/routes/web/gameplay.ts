import type { Track } from '@prisma/client';
import { Hono } from 'hono';
import { prisma } from '../../db';
import { submitActivitySchema } from '../../schemas';
import { buildDashboard } from '../../services/dashboard';
import { submitActivity } from '../../services/submit-activity';
import { jsonErr } from './shared';

/** Dashboard, level, aktivitas, submit skor. */
export const gameplayApp = new Hono();

gameplayApp.get('/api/profiles/:id/dashboard', async (c) => {
  const id = c.req.param('id');
  const dash = await buildDashboard(id);
  if (!dash) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);
  return c.json({ data: dash });
});

/** Preferensi perangkat (singleton) — dipakai anak & sinkron ke feedback permainan. */
gameplayApp.get('/api/device/preferences', async (c) => {
  const s = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({
    data: {
      dailyTimeCapMinutes: s?.dailyTimeCapMinutes ?? 30,
      breakReminderMinutes: s?.breakReminderMinutes ?? 15,
      sfxEnabled: s?.sfxEnabled ?? true,
      musicEnabled: s?.musicEnabled ?? true,
      reduceMotion: s?.reduceMotion ?? false,
    },
  });
});

/** Batas bermain & reminder (validasi profil anak + singleton). */
gameplayApp.get('/api/profiles/:id/wellness', async (c) => {
  const childId = c.req.param('id');
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);
  const s = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({
    data: {
      dailyTimeCapMinutes: s?.dailyTimeCapMinutes ?? 30,
      breakReminderMinutes: s?.breakReminderMinutes ?? 15,
      sfxEnabled: s?.sfxEnabled ?? true,
      musicEnabled: s?.musicEnabled ?? true,
      reduceMotion: s?.reduceMotion ?? false,
    },
  });
});

gameplayApp.get('/api/profiles/:id/stickers', async (c) => {
  const childId = c.req.param('id');
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  const rows = await prisma.earnedSticker.findMany({
    where: { childId },
    include: { sticker: true },
    orderBy: { earnedAt: 'desc' },
  });

  return c.json({
    data: rows.map((r) => ({
      id: r.sticker.id,
      name: r.sticker.name,
      imagePath: r.sticker.imagePath,
      rarity: r.sticker.rarity,
      theme: r.sticker.theme,
      earnedAt: r.earnedAt.toISOString(),
    })),
  });
});

gameplayApp.get('/api/profiles/:id/levels', async (c) => {
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

gameplayApp.get('/api/profiles/:childId/levels/:levelId', async (c) => {
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

gameplayApp.get('/api/activities/:id', async (c) => {
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

gameplayApp.post(
  '/api/profiles/:childId/activities/:activityId/submit',
  async (c) => {
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
  },
);
