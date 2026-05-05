import type { Context, MiddlewareHandler } from 'hono';

function clientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('cf-connecting-ip') ??
    'unknown'
  );
}

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

/** Rate limit per IP + key. Ringan (in-memory), cukup untuk satu proses Fly. */
export function createRateLimiter(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): MiddlewareHandler {
  return async (c, next) => {
    const k = `${opts.key}:${clientIp(c)}`;
    const now = Date.now();
    let b = store.get(k);
    if (!b || now >= b.resetAt) {
      b = { count: 0, resetAt: now + opts.windowMs };
      store.set(k, b);
    }
    if (b.count >= opts.limit) {
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message:
              'Terlalu banyak permintaan dari alamat ini. Tunggu sebentar lalu coba lagi.',
          },
        },
        429,
      );
    }
    b.count += 1;
    if (store.size > 20_000) {
      for (const [key, bucket] of store) {
        if (now >= bucket.resetAt) store.delete(key);
      }
    }
    await next();
  };
}
