/**
 * Pembuatan klien Hono RPC bersama untuk `AppType`.
 * Pemanggilan domain tetap di `apps/web` (`api.ts`, `api-admin.ts`).
 *
 * Inferensi `hc<AppType>()` pada router gabungan besar sering jatuh ke `unknown`
 * di TypeScript; satu assertion di bawah menjaga ergonomi `.api…` tanpa duplikasi path string.
 */
import type { AppType } from '@mainceria/types';
import { hc } from 'hono/client';

export function createHcApi(getBaseUrl: () => string) {
  const hcRaw = hc<AppType>(getBaseUrl(), {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, {
        ...init,
        credentials: 'include',
      }),
  });
  // biome-ignore lint/suspicious/noExplicitAny: inference Hono pada AppType besar
  return hcRaw as any;
}

export async function unwrapData<T>(
  res: Response | Promise<Response>,
): Promise<T> {
  const r = await Promise.resolve(res);
  const raw = await r.text();
  let json: { data?: T; error?: { message?: string } };
  try {
    json = raw ? (JSON.parse(raw) as typeof json) : {};
  } catch {
    const hint =
      raw.trimStart().startsWith('<!DOCTYPE') ||
      raw.trimStart().startsWith('<html')
        ? 'API mengembalikan halaman HTML (bukan JSON). Periksa proxy Netlify / URL backend.'
        : 'Respons bukan JSON.';
    throw new Error(hint);
  }
  if (!r.ok || json.error) {
    throw new Error(json.error?.message ?? r.statusText);
  }
  return json.data as T;
}
