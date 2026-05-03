import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/** Hanya untuk `prisma generate` / CLI tanpa `.env` (Netlify build, dll.). Tidak dipakai koneksi nyata. */
const PLACEHOLDER_DATASOURCE_URL =
  'postgresql://build:build@127.0.0.1:5432/prisma_config_placeholder?schema=public';

/**
 * URL untuk Prisma CLI (`migrate deploy`, dll.).
 * Prisma Postgres: pakai **Direct** di `DATABASE_DIRECT_URL`; URL **Pooled** (`pooled.db.prisma.io`)
 * sering memunculkan P1001 dari Fly / CI saat migrasi.
 */
function datasourceUrlForCli(): string {
  const direct = process.env.DATABASE_DIRECT_URL?.trim();
  const primary = process.env.DATABASE_URL?.trim();
  if (direct && direct.length > 0) return direct;
  if (primary && primary.length > 0) return primary;
  return PLACEHOLDER_DATASOURCE_URL;
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrlForCli(),
  },
});
