import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/** Hanya untuk `prisma generate` / CLI tanpa `.env` (Netlify build, dll.). Tidak dipakai koneksi nyata. */
const PLACEHOLDER_DATASOURCE_URL =
  'postgresql://build:build@127.0.0.1:5432/prisma_config_placeholder?schema=public';

function datasourceUrl(): string {
  const u = process.env.DATABASE_URL?.trim();
  return u && u.length > 0 ? u : PLACEHOLDER_DATASOURCE_URL;
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl(),
  },
});
