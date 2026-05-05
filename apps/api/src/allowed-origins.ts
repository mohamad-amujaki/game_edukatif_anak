/**
 * Origin browser untuk CORS & Better Auth `trustedOrigins`.
 * Tambahkan deploy baru lewat env `CORS_ORIGINS` (pisahkan koma).
 */
export function allowedBrowserOrigins(): string[] {
  const fromEnv =
    process.env.CORS_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    // Port cadangan Vite jika 5173 sudah dipakai (`VITE_DEV_PORT=5174`, dll.).
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://game-edukatif-anak.netlify.app',
  ];
  return [...new Set([...defaults, ...fromEnv])];
}
