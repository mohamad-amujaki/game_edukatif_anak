/**
 * Origin untuk Hono RPC + Better Auth.
 * - Dev: origin Vite (proxy `/api` → API lokal).
 * - Prod Netlify: umumnya origin Netlify jika `/api/*` di-proxy ke Fly (netlify.toml).
 * - Prod langsung ke API: set `VITE_API_URL` di build (mis. `https://xxx.fly.dev`).
 */
export function apiBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && /^https?:\/\//i.test(fromEnv.trim())) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return import.meta.env.DEV ? 'http://localhost:5173' : '';
}
