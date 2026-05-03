import type { Prisma } from '@prisma/client';
import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import { requireAdminRole } from './admin-middleware';
import { AuditActions, recordAudit } from './audit';
import { getBankSlice, validateBankItems } from './bank-validation';
import { prisma } from './db';
import {
  activityUpdateSchema,
  auditLogQuerySchema,
  bankItemUpdateSchema,
  bankSingleItemSchema,
  childUpdateSchema,
  globalSettingsUpdateSchema,
  importBankSchema,
  levelUpdateSchema,
  parentDeviceSettingsUpdateSchema,
} from './schemas.admin';
import { getAdminAnalyticsCached } from './services/admin-analytics';

const admin = new Hono();

// Middleware to check if content is locked
const checkContentLock = async (c: Context, next: Next) => {
  const settings = await prisma.adminGlobalSettings.findUnique({
    where: { id: 'singleton' },
  });
  const adminUser = c.get('adminUser');

  if (settings?.contentLockedForEdit && adminUser?.role !== 'super_admin') {
    return c.json(
      { error: 'Konten sedang dikunci untuk perubahan oleh super_admin.' },
      423,
    );
  }
  await next();
};

// Apply middleware to all /api/admin/* routes
// Note: Roles will be refined per route if needed, but for now we allow all 3 roles for basic reading
const allAdminRoles = ['super_admin', 'content_editor', 'analyst'];
const writeAdminRoles = ['super_admin', 'content_editor'];
const superAdminOnly = ['super_admin'];

admin.use('*', requireAdminRole(allAdminRoles));

// === Children Management ===

admin.get('/children', async (c) => {
  const activeWithin = c.req.query('activeWithin');
  const mode = c.req.query('mode') as 'TK' | 'SD1' | undefined;
  const q = c.req.query('q');

  const where: Record<string, unknown> = {};
  if (mode) where.ageMode = mode;
  if (q) where.name = { contains: q };

  // activeWithin logic (simplified for now: check PlaySession or Progress)
  if (activeWithin) {
    // implementation for activeWithin can be complex in SQLite, skipping for MVP basic list
  }

  const list = await prisma.childProfile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return c.json({ data: list });
});

admin.get('/children/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'bad request' }, 400);
  const child = await prisma.childProfile.findUnique({
    where: { id },
    include: {
      _count: {
        select: { playSessions: true, progress: true },
      },
    },
  });
  if (!child) return c.json({ error: 'not found' }, 404);
  return c.json({ data: child });
});

admin.patch('/children/:id', requireAdminRole(superAdminOnly), async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'bad request' }, 400);
  const body = await c.req.json();
  const parsed = childUpdateSchema.parse(body);

  const before = await prisma.childProfile.findUnique({ where: { id } });
  if (!before) return c.json({ error: 'not found' }, 404);

  const updated = await prisma.childProfile.update({
    where: { id },
    data: parsed,
  });

  await recordAudit(c, {
    action: AuditActions.CHILD_UPDATE,
    entityType: 'ChildProfile',
    entityId: id,
    before,
    after: updated,
  });

  return c.json({ data: updated });
});

admin.delete('/children/:id', requireAdminRole(writeAdminRoles), async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'bad request' }, 400);
  const before = await prisma.childProfile.findUnique({ where: { id } });
  if (!before) return c.json({ error: 'not found' }, 404);

  await prisma.childProfile.delete({ where: { id } });

  await recordAudit(c, {
    action: AuditActions.CHILD_DELETE,
    entityType: 'ChildProfile',
    entityId: id,
    before,
  });

  return c.body(null, 204);
});

admin.post(
  '/children/:id/reset-progress',
  requireAdminRole(superAdminOnly),
  async (c) => {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'bad request' }, 400);
    const child = await prisma.childProfile.findUnique({ where: { id } });
    if (!child) return c.json({ error: 'not found' }, 404);

    // Hard reset progress for this child
    await prisma.$transaction([
      prisma.progress.deleteMany({ where: { childId: id } }),
      prisma.levelMastery.deleteMany({ where: { childId: id } }),
      prisma.xpLog.deleteMany({ where: { childId: id } }),
      prisma.earnedBadge.deleteMany({ where: { childId: id } }),
      prisma.earnedSticker.deleteMany({ where: { childId: id } }),
      prisma.playSession.deleteMany({ where: { childId: id } }),
      prisma.dailyStreak.deleteMany({ where: { childId: id } }),
    ]);

    await recordAudit(c, {
      action: AuditActions.CHILD_RESET_PROGRESS,
      entityType: 'ChildProfile',
      entityId: id,
    });

    return c.json({ ok: true });
  },
);

// === Audit Log ===

admin.get('/audit-log', async (c: Context) => {
  const query = c.req.query();
  const parsed = auditLogQuerySchema.parse(query);
  const adminUser = (
    c as Context<{
      Variables: { adminUser: { id: string; role?: string | null } };
    }>
  ).get('adminUser');

  const where: Prisma.AuditLogWhereInput = {};

  if (adminUser?.role !== 'super_admin') {
    where.actorId = adminUser?.id ?? '';
  } else if (parsed.actor) {
    where.actorId = parsed.actor;
  }

  if (parsed.entityType) where.entityType = parsed.entityType;

  if (parsed.actorType) where.actorType = parsed.actorType;

  if (parsed.from || parsed.to) {
    where.createdAt = {};
    if (parsed.from) where.createdAt.gte = new Date(parsed.from);
    if (parsed.to) where.createdAt.lte = new Date(parsed.to);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return c.json({ data: logs });
});

// === Content Management (Levels & Activities) ===

admin.get('/levels', async (c) => {
  const levels = await prisma.levelDefinition.findMany({
    orderBy: [{ ageMode: 'asc' }, { track: 'asc' }, { order: 'asc' }],
    include: {
      activities: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          type: true,
          order: true,
          estimatedSec: true,
        },
      },
      _count: { select: { activities: true } },
    },
  });
  return c.json({ data: levels });
});

admin.patch(
  '/levels/:id',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'bad request' }, 400);
    const body = await c.req.json();
    const parsed = levelUpdateSchema.parse(body);

    const before = await prisma.levelDefinition.findUnique({ where: { id } });
    if (!before) return c.json({ error: 'Level not found' }, 404);

    const updated = await prisma.levelDefinition.update({
      where: { id },
      data: parsed,
    });

    await recordAudit(c, {
      action: AuditActions.LEVEL_UPDATE,
      entityType: 'LevelDefinition',
      entityId: id,
      before,
      after: updated,
    });

    return c.json({ data: updated });
  },
);

admin.get('/activities/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'bad request' }, 400);
  const activity = await prisma.activityDefinition.findUnique({
    where: { id },
    include: { level: true },
  });
  if (!activity) return c.json({ error: 'Activity not found' }, 404);
  return c.json({ data: activity });
});

admin.patch(
  '/activities/:id',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'bad request' }, 400);
    const body = await c.req.json();
    const parsed = activityUpdateSchema.parse(body);

    const before = await prisma.activityDefinition.findUnique({
      where: { id },
    });
    if (!before) return c.json({ error: 'Activity not found' }, 404);

    const updated = await prisma.activityDefinition.update({
      where: { id },
      data: parsed,
    });

    await recordAudit(c, {
      action: AuditActions.ACTIVITY_PAYLOAD_UPDATE,
      entityType: 'ActivityDefinition',
      entityId: id,
      before,
      after: updated,
    });

    return c.json({ data: updated });
  },
);

// === Bank Editor (CRUD granular) ===

admin.get('/activities/:id/bank', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'bad request' }, 400);
  const activity = await prisma.activityDefinition.findUnique({
    where: { id },
    select: { payload: true, type: true },
  });
  if (!activity) return c.json({ error: 'Activity not found' }, 404);

  const payload = JSON.parse(activity.payload) as Record<string, unknown>;
  const { items } = getBankSlice(payload, activity.type);

  return c.json({ data: items, activityType: activity.type });
});

admin.put(
  '/activities/:id/bank',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'bad request' }, 400);
    const body = await c.req.json();
    const parsed = bankItemUpdateSchema.parse(body);

    const activity = await prisma.activityDefinition.findUnique({
      where: { id },
    });
    if (!activity) return c.json({ error: 'Activity not found' }, 404);

    const validated = validateBankItems(activity.type, parsed.items);
    if (!validated.ok) {
      return c.json(
        { error: 'validasi bank gagal', details: validated.errors },
        400,
      );
    }

    const payload = JSON.parse(activity.payload) as Record<string, unknown>;
    const { storageKey } = getBankSlice(payload, activity.type);
    payload[storageKey] = validated.items;

    const updated = await prisma.activityDefinition.update({
      where: { id },
      data: { payload: JSON.stringify(payload) },
    });

    await recordAudit(c, {
      action: AuditActions.BANK_BULK_REPLACE,
      entityType: 'ActivityDefinition',
      entityId: id,
      before: activity.payload,
      after: updated.payload,
    });

    return c.json({ ok: true });
  },
);

async function persistBankPayload(
  activityId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await prisma.activityDefinition.update({
    where: { id: activityId },
    data: { payload: JSON.stringify(payload) },
  });
}

admin.post(
  '/activities/:id/bank/items',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'bad request' }, 400);
    const body = await c.req.json();
    const parsed = bankSingleItemSchema.parse(body);

    const activity = await prisma.activityDefinition.findUnique({
      where: { id },
    });
    if (!activity) return c.json({ error: 'Activity not found' }, 404);

    const validated = validateBankItems(activity.type, [parsed.item]);
    if (!validated.ok) {
      return c.json(
        { error: 'validasi bank gagal', details: validated.errors },
        400,
      );
    }

    const payload = JSON.parse(activity.payload) as Record<string, unknown>;
    const { storageKey, items } = getBankSlice(payload, activity.type);
    items.push(validated.items[0]);
    payload[storageKey] = items;

    await persistBankPayload(id, payload);

    await recordAudit(c, {
      action: AuditActions.BANK_ITEM_CREATE,
      entityType: 'ActivityDefinition',
      entityId: id,
    });

    return c.json({ ok: true, index: items.length - 1 });
  },
);

admin.patch(
  '/activities/:id/bank/items/:idx',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const id = c.req.param('id');
    const idxRaw = c.req.param('idx');
    if (!id || idxRaw === undefined)
      return c.json({ error: 'bad request' }, 400);
    const idx = Number.parseInt(idxRaw, 10);
    if (!Number.isFinite(idx) || idx < 0) {
      return c.json({ error: 'index tidak valid' }, 400);
    }

    const body = await c.req.json();
    const parsed = bankSingleItemSchema.parse(body);

    const activity = await prisma.activityDefinition.findUnique({
      where: { id },
    });
    if (!activity) return c.json({ error: 'Activity not found' }, 404);

    const validated = validateBankItems(activity.type, [parsed.item]);
    if (!validated.ok) {
      return c.json(
        { error: 'validasi bank gagal', details: validated.errors },
        400,
      );
    }

    const payload = JSON.parse(activity.payload) as Record<string, unknown>;
    const { storageKey, items } = getBankSlice(payload, activity.type);
    if (idx >= items.length)
      return c.json({ error: 'index di luar rentang' }, 404);

    items[idx] = validated.items[0];
    payload[storageKey] = items;

    await persistBankPayload(id, payload);

    await recordAudit(c, {
      action: AuditActions.BANK_ITEM_UPDATE,
      entityType: 'ActivityDefinition',
      entityId: `${id}:${idx}`,
    });

    return c.json({ ok: true });
  },
);

admin.delete(
  '/activities/:id/bank/items/:idx',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const id = c.req.param('id');
    const idxRaw = c.req.param('idx');
    if (!id || idxRaw === undefined)
      return c.json({ error: 'bad request' }, 400);
    const idx = Number.parseInt(idxRaw, 10);
    if (!Number.isFinite(idx) || idx < 0) {
      return c.json({ error: 'index tidak valid' }, 400);
    }

    const activity = await prisma.activityDefinition.findUnique({
      where: { id },
    });
    if (!activity) return c.json({ error: 'Activity not found' }, 404);

    const payload = JSON.parse(activity.payload) as Record<string, unknown>;
    const { storageKey, items } = getBankSlice(payload, activity.type);
    if (idx >= items.length)
      return c.json({ error: 'index di luar rentang' }, 404);

    items.splice(idx, 1);
    payload[storageKey] = items;

    await persistBankPayload(id, payload);

    await recordAudit(c, {
      action: AuditActions.BANK_ITEM_DELETE,
      entityType: 'ActivityDefinition',
      entityId: `${id}:${idx}`,
    });

    return c.json({ ok: true });
  },
);

// === Analytics (PRD §7: DAU/MAU, retensi, level completion, bintang, play time) ===

admin.get('/analytics/overview', async (c) => {
  const { data, cached } = await getAdminAnalyticsCached();
  return c.json({ data, cached });
});

admin.get('/analytics/retention', async (c) => {
  const { data, cached } = await getAdminAnalyticsCached();
  return c.json({
    data: {
      dauToday: data.dauToday,
      mau30d: data.mau30d,
      retentionD1Pct: data.retentionD1Pct,
      retentionD7Pct: data.retentionD7Pct,
      retentionCohortD1: data.retentionCohortD1,
      retentionCohortD7: data.retentionCohortD7,
    },
    cached,
  });
});

admin.get('/analytics/level-completion', async (c) => {
  const { data, cached } = await getAdminAnalyticsCached();
  return c.json({ data: data.levelCompletion, cached });
});

admin.get('/analytics/avg-stars', async (c) => {
  const { data, cached } = await getAdminAnalyticsCached();
  return c.json({ data: data.avgStarsByActivity, cached });
});

admin.get('/analytics/play-time', async (c) => {
  const { data, cached } = await getAdminAnalyticsCached();
  return c.json({
    data: {
      totalPlayTimeMinutes: data.totalPlayTimeMinutes,
      totalSessions: data.totalSessions,
    },
    cached,
  });
});

// === Global Settings ===

admin.get('/settings', async (c) => {
  const settings = await prisma.adminGlobalSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({
    data: settings || {
      id: 'singleton',
      defaultDailyTimeCapMinutes: 30,
      defaultBreakReminderMinutes: 20,
      contentLockedForEdit: false,
    },
  });
});

admin.patch('/settings', requireAdminRole(superAdminOnly), async (c) => {
  const body = await c.req.json();
  const parsed = globalSettingsUpdateSchema.parse(body);

  const updated = await prisma.adminGlobalSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...parsed },
    update: parsed,
  });

  await recordAudit(c, {
    action: AuditActions.SETTINGS_UPDATE,
    entityType: 'AdminGlobalSettings',
    entityId: 'singleton',
    after: updated,
  });

  return c.json({ data: updated });
});

// === Pengaturan orang tua (perangkat / PIN) — super_admin ===

admin.get('/parent-settings', requireAdminRole(superAdminOnly), async (c) => {
  const s = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  return c.json({
    data: {
      isSuperParent: s?.isSuperParent ?? false,
    },
  });
});

admin.patch('/parent-settings', requireAdminRole(superAdminOnly), async (c) => {
  const body = await c.req.json();
  const parsed = parentDeviceSettingsUpdateSchema.parse(body);

  const before = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });

  const updated = await prisma.parentSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      ...(typeof parsed.isSuperParent === 'boolean'
        ? { isSuperParent: parsed.isSuperParent }
        : {}),
    },
    update:
      typeof parsed.isSuperParent === 'boolean'
        ? { isSuperParent: parsed.isSuperParent }
        : {},
  });

  await recordAudit(c, {
    action: AuditActions.PARENT_SUPER_FLAG_UPDATE,
    entityType: 'ParentSettings',
    entityId: 'singleton',
    before,
    after: updated,
  });

  return c.json({
    data: { isSuperParent: updated.isSuperParent },
  });
});

// === Import/Export ===

admin.get('/export/bank/:id', requireAdminRole(writeAdminRoles), async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'bad request' }, 400);
  const activity = await prisma.activityDefinition.findUnique({
    where: { id },
    include: { level: true },
  });
  if (!activity) return c.json({ error: 'Activity not found' }, 404);

  const payload = JSON.parse(activity.payload) as Record<string, unknown>;
  const { items } = getBankSlice(payload, activity.type);

  return c.json({
    activity: { id: activity.id, type: activity.type, title: activity.title },
    items,
    exportedAt: new Date().toISOString(),
  });
});

admin.get('/export/all', requireAdminRole(writeAdminRoles), async (c) => {
  const levels = await prisma.levelDefinition.findMany({
    orderBy: [{ ageMode: 'asc' }, { track: 'asc' }, { order: 'asc' }],
  });
  const activities = await prisma.activityDefinition.findMany({
    orderBy: [{ levelId: 'asc' }, { order: 'asc' }],
  });

  const banks = activities.map((act) => {
    const payload = JSON.parse(act.payload) as Record<string, unknown>;
    const { items } = getBankSlice(payload, act.type);
    return { activityId: act.id, activityType: act.type, items };
  });

  await recordAudit(c, {
    action: AuditActions.EXPORT_RUN,
    entityType: 'ContentBundle',
    entityId: 'all',
  });

  return c.json({
    exportedAt: new Date().toISOString(),
    levels,
    activities: activities.map((a) => ({
      ...a,
      payload: JSON.parse(a.payload),
    })),
    banks,
  });
});

admin.post(
  '/import/bank',
  requireAdminRole(writeAdminRoles),
  checkContentLock,
  async (c) => {
    const body = await c.req.json();
    const parsed = importBankSchema.parse(body);

    const activity = await prisma.activityDefinition.findUnique({
      where: { id: parsed.activityId },
    });
    if (!activity) return c.json({ error: 'Activity not found' }, 404);

    const validated = validateBankItems(activity.type, parsed.items);
    if (!validated.ok) {
      return c.json(
        { error: 'validasi bank gagal', details: validated.errors },
        400,
      );
    }
    const safeItems = validated.items;

    const payload = JSON.parse(activity.payload) as Record<string, unknown>;
    const { storageKey, items: existingSlice } = getBankSlice(
      payload,
      activity.type,
    );
    if (parsed.mode === 'replace') {
      payload[storageKey] = safeItems;
    } else {
      payload[storageKey] = [...existingSlice, ...safeItems];
    }

    await prisma.activityDefinition.update({
      where: { id: parsed.activityId },
      data: { payload: JSON.stringify(payload) },
    });

    await recordAudit(c, {
      action: AuditActions.IMPORT_RUN,
      entityType: 'ActivityDefinition',
      entityId: parsed.activityId,
    });

    return c.json({ ok: true });
  },
);

export { admin as adminRouter };
