# API Hono saja (bukan build Vite). Fly.io / Docker umum.
FROM node:22-bookworm-slim AS runner

RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY server ./server
COPY tsconfig.json ./

ENV NODE_ENV=production

# Hanya untuk langkah ini: `postinstall` → `prisma generate` memuat prisma.config.ts.
# Jangan `ENV DATABASE_URL` di image — di Fly itu mengalahkan secret dan `migrate deploy`
# akan memakai dummy 127.0.0.1. Pastikan `fly secrets set DATABASE_URL=...` ke Postgres Anda.
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/prisma_image_build?schema=public" \
  pnpm install --frozen-lockfile --prod

EXPOSE 8080

ENV PORT=8080

# Migrasi di Fly lewat `release_command` di fly.toml — server siap cepat untuk health check.
CMD ["pnpm", "run", "start:server"]
