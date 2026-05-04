import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { ZodError } from 'zod';
import { adminRouter } from './admin';
import { allowedBrowserOrigins } from './allowed-origins';
import { auth } from './auth';
import { injectForwardedHostFromOrigin } from './auth-proxy-headers';
import { createRateLimiter } from './rate-limit';
import { webApi } from './routes/web';
import { captureServerException } from './sentry';
import { runWeeklyParentEmailJob } from './services/weekly-parent-email';

const rateAuth = createRateLimiter({
  key: 'better-auth',
  limit: 120,
  windowMs: 60 * 1000,
});

const api = new Hono()
  .onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: err.message } },
        400,
      );
    }
    console.error('[api] unhandled', err);
    captureServerException(err);
    return c.json(
      { error: { code: 'INTERNAL', message: 'Terjadi kesalahan' } },
      500,
    );
  })
  .use(
    '*',
    cors({
      origin: allowedBrowserOrigins(),
      credentials: true,
      allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-Parent-Session',
        'X-Cron-Secret',
      ],
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .use('*', prettyJSON());

api.route('/api/admin', adminRouter);
api.route('/', webApi);

/** Cron Fly Machines / scheduler: set `CRON_SECRET` dan header `X-Cron-Secret`. */
api.post('/api/cron/weekly-parent-email', async (c) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header('X-Cron-Secret') !== secret) {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Forbidden' } },
      401,
    );
  }
  const result = await runWeeklyParentEmailJob();
  return c.json({ data: result });
});

/**
 * Tipe untuk Hono RPC **sebelum** mount better-auth wildcard (`/api/auth/*`), agar inferensi
 * skema tidak rusak. Auth di-register tepat setelah baris ini.
 */
export type AppType = typeof api;

api.use('/api/auth/*', rateAuth);
api.on(['POST', 'GET'], '/api/auth/*', (c) =>
  auth.handler(injectForwardedHostFromOrigin(c.req.raw)),
);

export const app = api;
