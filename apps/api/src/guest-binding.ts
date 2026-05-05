import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

/** Cookie penyekat profil tamu di server — bukan penyimpan progres IndexedDB mandiri (PR §5.3). */
export const KID_GUEST_BINDING_COOKIE = 'kid_guest_binding';

const MAX_AGE_SEC = 60 * 60 * 24 * 400;

/** Pastikan ada binding opaque; set cookie HttpOnly ketika baru dibuat. */
export function ensureGuestBindingCookie(c: Context): string {
  const existing = getCookie(c, KID_GUEST_BINDING_COOKIE)?.trim();
  if (existing) return existing;
  const next = randomUUID();
  const isProd = process.env.NODE_ENV === 'production';
  setCookie(c, KID_GUEST_BINDING_COOKIE, next, {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    maxAge: MAX_AGE_SEC,
  });
  return next;
}
