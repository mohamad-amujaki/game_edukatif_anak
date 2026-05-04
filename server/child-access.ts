import type { ChildProfile } from '@prisma/client';
import type { Context } from 'hono';
import { auth } from './auth';
import { prisma } from './db';
import { ensureGuestBindingCookie } from './guest-binding';
import { jsonErr } from './routes/web/shared';

export const ADMIN_STAFF_ROLES = [
  'super_admin',
  'content_editor',
  'analyst',
] as const;

export async function sessionUserFromCookies(
  c: Context,
): Promise<{ id: string; role: string | null } | null> {
  const raw = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!raw?.user?.id) return null;
  return { id: raw.user.id, role: raw.user.role ?? null };
}

function isStaffRole(role: string | null): role is string {
  return (
    role != null &&
    ADMIN_STAFF_ROLES.includes(role as (typeof ADMIN_STAFF_ROLES)[number])
  );
}

/** Sesi bermain utama: orang tua ber-akun (bukan staf panel admin). */
export function isParentAppRole(role: string | null): boolean {
  // Legacy akun/email sosial lama bisa punya `role = null`.
  // Selama bukan role staf admin, perlakukan sebagai parent app.
  return !isStaffRole(role);
}

/**
 * Baris legacy (tanpa owner tanpa binding) diadopsi sekali ke bucket tamu dari cookie ini —
 * diasumsikan penyebar tunggal; hindari instalasi DB multi-keluarga bersama sans login.
 */
export async function adoptOrphanGuestProfiles(binding: string): Promise<void> {
  await prisma.childProfile.updateMany({
    where: { ownerUserId: null, guestBindingId: null },
    data: { guestBindingId: binding },
  });
}

async function fetchChild(childId: string): Promise<ChildProfile | null> {
  return prisma.childProfile.findUnique({ where: { id: childId } });
}

/**
 * Mengembalikan profil jika penjelajah boleh memuatnya di app anak:
 * orang tua: ownerUserId sama; tamu: owner null + guestBinding cocok setelah orphan-adopt.
 */
export async function assertChildProfileAccessible(
  c: Context,
  childId: string,
): Promise<ChildProfile | null> {
  const u = await sessionUserFromCookies(c);

  if (u && isParentAppRole(u.role)) {
    const child = await fetchChild(childId);
    if (!child || child.ownerUserId !== u.id) return null;
    return child;
  }

  if (u && isStaffRole(u.role)) return null;

  const binding = ensureGuestBindingCookie(c);
  await adoptOrphanGuestProfiles(binding);

  const child = await fetchChild(childId);
  if (!child) return null;
  if (child.ownerUserId != null) return null;
  if (child.guestBindingId !== binding) return null;
  return child;
}

export async function gateChildProfileForKidAppOrJson(
  c: Context,
  childId: string,
): Promise<ChildProfile | Response> {
  const allowed = await assertChildProfileAccessible(c, childId);
  if (allowed) return allowed;
  const exists = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { id: true },
  });
  if (!exists) return jsonErr('NOT_FOUND', 'Profil tidak ada', 404);
  return jsonErr('FORBIDDEN', 'Akses profil ditolak', 403);
}
