import './boot-env';
import { serve } from '@hono/node-server';
import { app } from './app';

/** Fly/Railway menyetel `PORT` ke `internal_port` (8080). Fallback prod → 8080, dev → 3000. */
function listenPort(): number {
  const raw = process.env.PORT ?? process.env.API_PORT;
  const n = raw !== undefined && raw !== '' ? Number(raw) : Number.NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return process.env.NODE_ENV === 'production' ? 8080 : 3000;
}

const port = listenPort();

const server = serve(
  /** `0.0.0.0` wajib agar fly-proxy / Docker bisa mencapai proses (bukan hanya localhost). */
  { fetch: app.fetch, port, hostname: '0.0.0.0' },
  (info) => {
    console.log(
      `[api] listening on http://0.0.0.0:${info.port} (PORT=${process.env.PORT ?? 'unset'})`,
    );
  },
);

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[api] Port ${port} sudah dipakai. Hentikan proses lain atau jalankan \`pnpm dev\` (otomatis mencari port kosong).\n`,
    );
  } else {
    console.error('[api]', err);
  }
  process.exit(1);
});
