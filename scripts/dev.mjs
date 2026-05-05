#!/usr/bin/env node
import { spawn } from 'node:child_process';
/**
 * Memilih port API kosong (mulai dari API_PORT atau 3000) dan menyelaraskan proxy Vite
 * lewat VITE_DEV_API_ORIGIN — menghindari EADDRINUSE saat port masih dipakai proses lain.
 */
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {number} port */
function portAvailable(port) {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', (err) => {
      const e = /** @type {NodeJS.ErrnoException} */ (err);
      if (e.code === 'EADDRINUSE') resolve(false);
      else reject(err);
    });
    s.once('listening', () => {
      s.close(() => resolve(true));
    });
    s.listen(port);
  });
}

/** @param {number} start */
async function findAvailablePort(start) {
  for (let p = start; p < start + 100; p++) {
    if (await portAvailable(p)) return p;
  }
  throw new Error(
    `Tidak ada port kosong di rentang ${start}–${start + 99}. Tutup proses yang memakai port tersebut.`,
  );
}

const preferredApi = Number(process.env.API_PORT) || 3000;
const apiPort = await findAvailablePort(preferredApi);

const env = {
  ...process.env,
  API_PORT: String(apiPort),
  VITE_DEV_API_ORIGIN: `http://127.0.0.1:${apiPort}`,
};

if (apiPort !== preferredApi) {
  console.warn(
    `[dev] Port ${preferredApi} sibuk — API memakai ${apiPort}. Proxy Vite diselaraskan.`,
  );
} else {
  console.log(
    `[dev] API → ${apiPort} · Proxy /api → ${env.VITE_DEV_API_ORIGIN}`,
  );
}

const child = spawn(
  'pnpm',
  [
    'exec',
    'concurrently',
    '-k',
    'pnpm --filter @mainceria/api dev',
    'pnpm --filter @mainceria/web dev:vite',
  ],
  {
    cwd: root,
    env,
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
