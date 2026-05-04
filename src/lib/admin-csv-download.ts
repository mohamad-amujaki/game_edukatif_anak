import { apiBaseURL } from '@/lib/api-base-url';

/** Unduh CSV dari API admin (cookie sesi Better Auth). */
export async function downloadAdminCsv(
  path: string,
  filename: string,
): Promise<void> {
  const base = apiBaseURL().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Export gagal (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
