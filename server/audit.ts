import { createHash } from 'node:crypto';
import type { Context } from 'hono';
import { prisma } from './db';

export const AuditActions = {
  CHILD_DELETE: 'child.delete',
  CHILD_UPDATE: 'child.update',
  CHILD_RESET_PROGRESS: 'child.reset-progress',
  LEVEL_UPDATE: 'level.update',
  ACTIVITY_PAYLOAD_UPDATE: 'activity.payload.update',
  BANK_ITEM_CREATE: 'bank.item.create',
  BANK_ITEM_UPDATE: 'bank.item.update',
  BANK_ITEM_DELETE: 'bank.item.delete',
  BANK_BULK_REPLACE: 'bank.bulk.replace',
  SETTINGS_UPDATE: 'settings.update',
  ADMIN_CREATE: 'admin.create',
  ADMIN_ROLE_UPDATE: 'admin.role.update',
  ADMIN_BAN: 'admin.ban',
  ADMIN_UNBAN: 'admin.unban',
  ADMIN_PASSWORD_SET: 'admin.password.set',
  ADMIN_SESSION_REVOKE: 'admin.session.revoke',
  IMPORT_RUN: 'import.run',
  EXPORT_RUN: 'export.run',
  PARENT_SUPER_FLAG_UPDATE: 'parent.super-flag.update',
  PROFILE_SELF_DEVICE: 'child.profile-self.device',
  PROFILE_SELF_PARENT: 'child.profile-self.parent',
} as const;

/** Jejak aksi super-orang tua (PIN); actorId = hash sesi (tanpa menyimpan token mentah). */
export async function recordSuperParentAudit(
  c: Context,
  params: {
    sessionToken: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  },
) {
  const actorId = createHash('sha256')
    .update(params.sessionToken)
    .digest('hex')
    .slice(0, 32);

  await prisma.auditLog.create({
    data: {
      actorType: 'SUPER_PARENT',
      actorId,
      actorEmail: null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      ipAddress:
        c.req.header('x-forwarded-for') ?? c.req.header('remote-addr') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    },
  });
}

/** Jejak ringan PATCH profil dari perangkat saat PIN belum diatur (tanpa sesi orang tua). */
export async function recordDeviceProfileSelfEdit(
  c: Context,
  params: {
    entityId: string;
    before: unknown;
    after: unknown;
  },
) {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('remote-addr') ??
    '';
  const ua = c.req.header('user-agent') ?? '';
  const actorId = createHash('sha256')
    .update(`${ip}|${ua}|${params.entityId}`)
    .digest('hex')
    .slice(0, 32);

  await prisma.auditLog.create({
    data: {
      actorType: 'DEVICE',
      actorId,
      actorEmail: null,
      action: AuditActions.PROFILE_SELF_DEVICE,
      entityType: 'ChildProfile',
      entityId: params.entityId,
      beforeJson: JSON.stringify(params.before),
      afterJson: JSON.stringify(params.after),
      ipAddress: ip || null,
      userAgent: ua || null,
    },
  });
}

export async function recordAudit(
  c: Context,
  params: {
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  },
) {
  const adminUser = c.get('adminUser') as
    | { id: string; email: string }
    | undefined;
  // Note: superParent handling will be added in G4
  const actorId = adminUser?.id ?? 'unknown';
  const actorEmail = adminUser?.email ?? null;

  await prisma.auditLog.create({
    data: {
      actorType: 'ADMIN',
      actorId,
      actorEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      ipAddress:
        c.req.header('x-forwarded-for') ?? c.req.header('remote-addr') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    },
  });
}
