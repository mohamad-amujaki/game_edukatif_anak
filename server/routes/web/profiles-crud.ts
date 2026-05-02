import { Hono } from 'hono';
import { AuditActions, recordSuperParentAudit } from '../../audit';
import { prisma } from '../../db';
import { denyUnlessSuperParent } from '../../parent-super-guard';
import { createProfileSchema, updateProfileSchema } from '../../schemas';
import { initializeLevelMastery } from '../../services/mastery';
import { jsonErr } from './shared';

/** Health, daftar/CRUD profil, reset progres super-orang tua. */
export const profilesCrudApp = new Hono();

profilesCrudApp.get('/api/health', (c) => c.json({ data: { ok: true } }));

profilesCrudApp.get('/api/profiles', async (c) => {
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

profilesCrudApp.post('/api/profiles', async (c) => {
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

profilesCrudApp.patch('/api/profiles/:id', async (c) => {
  const gate = await denyUnlessSuperParent(c);
  if (gate) return gate;

  const sessionToken = c.req.header('X-Parent-Session') ?? '';

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

  await recordSuperParentAudit(c, {
    sessionToken,
    action: AuditActions.CHILD_UPDATE,
    entityType: 'ChildProfile',
    entityId: id,
    before: {
      name: exists.name,
      avatarKey: exists.avatarKey,
      ageMode: exists.ageMode,
    },
    after: {
      name: updated.name,
      avatarKey: updated.avatarKey,
      ageMode: updated.ageMode,
    },
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

profilesCrudApp.delete('/api/profiles/:id', async (c) => {
  const gate = await denyUnlessSuperParent(c);
  if (gate) return gate;

  const sessionToken = c.req.header('X-Parent-Session') ?? '';
  const id = c.req.param('id');

  const existing = await prisma.childProfile.findUnique({ where: { id } });
  if (!existing) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  await prisma.childProfile.delete({ where: { id } });

  await recordSuperParentAudit(c, {
    sessionToken,
    action: AuditActions.CHILD_DELETE,
    entityType: 'ChildProfile',
    entityId: id,
    before: {
      name: existing.name,
      avatarKey: existing.avatarKey,
      ageMode: existing.ageMode,
    },
  });

  return c.body(null, 204);
});

profilesCrudApp.post('/api/parent/super/reset-progress/:childId', async (c) => {
  const gate = await denyUnlessSuperParent(c);
  if (gate) return gate;

  const childId = c.req.param('childId');
  if (!childId) return jsonErr('BAD_REQUEST', 'childId wajib', 400);

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);

  await prisma.$transaction([
    prisma.progress.deleteMany({ where: { childId } }),
    prisma.levelMastery.deleteMany({ where: { childId } }),
    prisma.xpLog.deleteMany({ where: { childId } }),
    prisma.earnedBadge.deleteMany({ where: { childId } }),
    prisma.earnedSticker.deleteMany({ where: { childId } }),
    prisma.playSession.deleteMany({ where: { childId } }),
    prisma.dailyStreak.deleteMany({ where: { childId } }),
  ]);

  await recordSuperParentAudit(c, {
    sessionToken: c.req.header('X-Parent-Session') ?? '',
    action: AuditActions.CHILD_RESET_PROGRESS,
    entityType: 'ChildProfile',
    entityId: childId,
    after: { ok: true },
  });

  return c.json({ data: { ok: true as const } });
});
