import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { adminRouter } from './admin';
import { allowedBrowserOrigins } from './allowed-origins';
import { auth } from './auth';
import { webApi } from './routes/web';

const api = new Hono()
  .use(
    '*',
    cors({
      origin: allowedBrowserOrigins(),
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization', 'X-Parent-Session'],
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .use('*', prettyJSON());

api.route('/api/admin', adminRouter);
api.route('/', webApi);

/**
 * Tipe untuk Hono RPC **sebelum** mount better-auth wildcard (`/api/auth/*`), agar inferensi
 * skema tidak rusak. Auth di-register tepat setelah baris ini.
 */
export type AppType = typeof api;

api.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

export const app = api;
