import { serve } from '@hono/node-server';
import { app } from './app';

/** Railway dan banyak PaaS menyetel `PORT`; lokal bisa pakai `API_PORT`. */
const port = Number(process.env.PORT ?? process.env.API_PORT) || 3000;

const server = serve(
  /** `0.0.0.0` diperlukan container (Fly.io, dll.); lokal tetap bisa diakses dari host. */
  { fetch: app.fetch, port, hostname: '0.0.0.0' },
  (info) => {
    console.log(`API listening on :${info.port}`);
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
