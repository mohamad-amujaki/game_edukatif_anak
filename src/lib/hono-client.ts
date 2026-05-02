/**
 * Klien Hono RPC: path mengikuti {@link AppType} di `server/app.ts`.
 * Pemanggilan tetap terpusat di `api.ts` / `api-admin.ts`.
 *
 * Inferensi `hc<AppType>()` pada router gabungan sering jatuh ke `unknown` di TypeScript;
 * satu assertion di bawah menjaga ergonomi chain `.api…` tanpa menyalin URL string.
 */
import type { AppType } from '@server/app';
import { hc } from 'hono/client';

const hcRaw = hc<AppType>('', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
});

// biome-ignore lint/suspicious/noExplicitAny: Hono Client inference pada AppType besar (lihat komentar atas)
export const hcApi = hcRaw as any;

export async function unwrapData<T>(
  res: Response | Promise<Response>,
): Promise<T> {
  const r = await Promise.resolve(res);
  const json = (await r.json()) as {
    data?: T;
    error?: { message?: string };
  };
  if (!r.ok || json.error) {
    throw new Error(json.error?.message ?? r.statusText);
  }
  return json.data as T;
}
