import { allowedBrowserOrigins } from './allowed-origins';

/**
 * Saat browser memanggil `https://….netlify.app/api/auth/*`, Netlify mem-proxy ke Fly.
 * Permintaan yang sampai di Fly sering punya `Host: *.fly.dev` tanpa `x-forwarded-host`,
 * sehingga Better Auth mengira base URL = Fly → cookie/sesi tidak selaras dengan origin
 * yang dipakai halaman (Netlify).
 *
 * Jika `x-forwarded-host` belum ada, isi dari header **`Origin`** selama origin itu ada di
 * allowlist CORS (sama dengan domain frontend yang sah).
 */
export function injectForwardedHostFromOrigin(req: Request): Request {
  if (req.headers.get('x-forwarded-host')) return req;

  const allowed = new Set(allowedBrowserOrigins());

  let origin: string | null = req.headers.get('origin');
  if (!origin) {
    const ref = req.headers.get('referer');
    if (ref) {
      try {
        origin = new URL(ref).origin;
      } catch {
        origin = null;
      }
    }
  }
  if (!origin || !allowed.has(origin)) return req;

  try {
    const u = new URL(origin);
    const headers = new Headers(req.headers);
    headers.set('x-forwarded-host', u.host);
    headers.set(
      'x-forwarded-proto',
      u.protocol === 'https:' ? 'https' : 'http',
    );
    /**
     * Pakai `new Request(req, { headers })` — Undici/Node menyalin body stream dengan benar.
     * Membuat `new Request(url, { body, duplex })` dari body mentah sering memicu 500 pada
     * POST `/api/auth/sign-in/email` di belakang proxy.
     */
    return new Request(req, { headers });
  } catch {
    return req;
  }
}
