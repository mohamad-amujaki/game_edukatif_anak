/** Satu sel CSV (RFC-ish), aman untuk teks bertanda kutip/newline. */
export function csvEscapeCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvEscapeCell).join(',');
}

export function csvWithBom(body: string): string {
  return `\uFEFF${body}`;
}
