import * as Sentry from '@sentry/node';

let initialized = false;

/** Inisialisasi sekali jika `SENTRY_DSN` diset (§9.4). */
export function initSentryFromEnv(): void {
  if (initialized) return;
  initialized = true;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  });
}

export function captureServerException(err: unknown): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  Sentry.captureException(err);
}
