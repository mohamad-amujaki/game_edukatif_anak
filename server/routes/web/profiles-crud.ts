import { Hono } from 'hono';
import {
  AuditActions,
  recordDeviceProfileSelfEdit,
  recordSuperParentAudit,
} from '../../audit';
import {
  adoptOrphanGuestProfiles,
  gateChildProfileForKidAppOrJson,
  isParentAppRole,
  sessionUserFromCookies,
} from '../../child-access';
import { prisma } from '../../db';
import { ensureGuestBindingCookie } from '../../guest-binding';
import { isParentSessionValid } from '../../parent-session';
import { denyUnlessSuperParent } from '../../parent-super-guard';
import { createRateLimiter } from '../../rate-limit';
import { createProfileSchema, updateProfileSchema } from '../../schemas';
import { initializeLevelMastery } from '../../services/mastery';
import { jsonErr } from './shared';

const ratePatchProfileSelf = createRateLimiter({
  key: 'patch-profile-self',
  limit: 48,
  windowMs: 10 * 60 * 1000,
});

/** Health, daftar/CRUD profil, reset progres super-orang tua. */
export const profilesCrudApp = new Hono();

function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

/**
 * Health + sinyal fitur untuk UI (ada di semua rilis yang memakai rute ini).
 * `googleOAuth` disertakan di sini agar cek produksi lewat proxy Netlify tetap jalan
 * walau image Fly belum memuat `/api/app/features`.
 */
profilesCrudApp.get('/api/health', (c) =>
  c.json({
    data: { ok: true as const, googleOAuth: googleOAuthConfigured() },
  }),
);

/** Fitur frontend (gateway publik) — duplikat flag untuk kompatibilitas dokumen / curl. */
profilesCrudApp.get('/api/app/features', (c) =>
  c.json({
    data: {
      googleOAuth: googleOAuthConfigured(),
    },
  }),
);

/** Legacy: wizard admin pertama sekarang CLI `pnpm admin:create`. */
profilesCrudApp.get('/api/admin-signup/open', (c) =>
  c.json({ open: false as boolean }),
);

profilesCrudApp.get('/api/profiles', async (c) => {
  const u = await sessionUserFromCookies(c);

  if (u && isParentAppRole(u.role)) {
    const list = await prisma.childProfile.findMany({
      where: { ownerUserId: u.id },
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
  }

  const binding = ensureGuestBindingCookie(c);
  await adoptOrphanGuestProfiles(binding);
  const list = await prisma.childProfile.findMany({
    where: { ownerUserId: null, guestBindingId: binding },
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

  const u = await sessionUserFromCookies(c);

  if (u && isParentAppRole(u.role)) {
    const count = await prisma.childProfile.count({
      where: { ownerUserId: u.id },
    });
    if (count >= 4)
      return jsonErr(
        'CONFLICT',
        'Maksimal 4 profil anak per akun orang tua',
        409,
      );

    const profile = await prisma.childProfile.create({
      data: { ...parsed.data, ownerUserId: u.id, guestBindingId: null },
    });
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
  }

  const binding = ensureGuestBindingCookie(c);
  await adoptOrphanGuestProfiles(binding);

  const gCount = await prisma.childProfile.count({
    where: { ownerUserId: null, guestBindingId: binding },
  });
  if (gCount >= 4)
    return jsonErr(
      'CONFLICT',
      'Maksimal 4 profil tamu untuk perangkat ini',
      409,
    );

  const profile = await prisma.childProfile.create({
    data: { ...parsed.data, ownerUserId: null, guestBindingId: binding },
  });
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

/**
 * Ubah profil dari beranda anak. Jika PIN orang tua sudah diatur, wajib header
 * `X-Parent-Session` (setelah verifikasi di Area orang tua).
 */
profilesCrudApp.patch(
  '/api/profiles/:id/self',
  ratePatchProfileSelf,
  async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success)
      return jsonErr('VALIDATION_ERROR', parsed.error.message, 400);

    const gated = await gateChildProfileForKidAppOrJson(c, id);
    if (gated instanceof Response) return gated;
    const exists = gated;

    const settings = await prisma.parentSettings.findUnique({
      where: { id: 'singleton' },
    });
    const sessionOk = await isParentSessionValid(
      c.req.header('X-Parent-Session'),
    );
    if (settings?.pinHash && !sessionOk) {
      return jsonErr(
        'UNAUTHORIZED',
        'PIN orang tua aktif — buka Area orang tua, masuk dengan PIN, lalu ubah profil lagi dari beranda.',
        401,
      );
    }

    const updated = await prisma.childProfile.update({
      where: { id },
      data: parsed.data,
    });

    const before = {
      name: exists.name,
      avatarKey: exists.avatarKey,
      ageMode: exists.ageMode,
    };
    const after = {
      name: updated.name,
      avatarKey: updated.avatarKey,
      ageMode: updated.ageMode,
    };

    if (settings?.pinHash) {
      await recordSuperParentAudit(c, {
        sessionToken: c.req.header('X-Parent-Session') ?? '',
        action: AuditActions.PROFILE_SELF_PARENT,
        entityType: 'ChildProfile',
        entityId: id,
        before,
        after,
      });
    } else {
      await recordDeviceProfileSelfEdit(c, {
        entityId: id,
        before,
        after,
      });
    }

    return c.json({
      data: {
        id: updated.id,
        name: updated.name,
        avatarKey: updated.avatarKey,
        ageMode: updated.ageMode,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  },
);

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
