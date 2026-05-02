# API Hono saja (bukan build Vite). Fly.io / Docker umum.
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY server ./server
COPY tsconfig.json ./

ENV NODE_ENV=production

RUN pnpm install --frozen-lockfile --prod \
  && pnpm exec prisma generate

EXPOSE 8080

ENV PORT=8080

CMD ["pnpm", "start"]
