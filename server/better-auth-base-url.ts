import { allowedBrowserOrigins } from './allowed-origins';

/**
 * Hostname (dengan port bila perlu) untuk Better Auth **dynamic** `baseURL`.
 * Setiap request: origin diambil dari `x-forwarded-host` / `host` (lihat better-auth
 * `advanced.trustedProxyHeaders`, default `true`) lalu dicek ke allowlist ini.
 *
 * Jadi saat Netlify mem-proxy `POST /api/auth/*` ke Fly, cookie & URL auth memakai
 * **https://game-edukatif-anak.netlify.app**, bukan `*.fly.dev`, tanpa hardcode statis
 * di satu env saja.
 */
export function betterAuthAllowedHosts(): string[] {
  const fromEnv =
    process.env.BETTER_AUTH_ALLOWED_HOSTS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const fromCors = allowedBrowserOrigins()
    .map((origin) => {
      try {
        return new URL(origin).host;
      } catch {
        return null;
      }
    })
    .filter((h): h is string => Boolean(h));

  const defaults = [
    'localhost:5173',
    '127.0.0.1:5173',
    'game-edukatif-anak.netlify.app',
    '*.netlify.app',
    'game-edukatif-api.fly.dev',
  ];

  return [...new Set([...defaults, ...fromCors, ...fromEnv])];
}

/** Digunakan bila host request tidak termasuk allowlist (jarang) atau konteks non-HTTP. */
export function betterAuthBaseUrlFallback(): string {
  return process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173';
}
