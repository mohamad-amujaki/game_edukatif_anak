import { emojiForKey } from '@/lib/emoji-map';
import type { ReactNode } from 'react';

/** Kartu mini per item bank — menyerupai tampilan anak untuk QA konten (§6.1). */
export function BankItemsPreviewGrid({
  activityType,
  itemsJson,
}: {
  activityType: string;
  itemsJson: string;
}) {
  let items: unknown[] = [];
  try {
    const p = JSON.parse(itemsJson) as unknown;
    if (Array.isArray(p)) items = p;
    else items = [];
  } catch {
    return (
      <p className="text-sm text-amber-800">
        Preview kartu tidak tersedia: JSON bank belum valid.
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Bank kosong (0 item).</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((raw, idx) => (
        <BankItemMiniCard key={idx} activityType={activityType} item={raw} />
      ))}
    </div>
  );
}

function BankItemMiniCard({
  activityType,
  item,
}: {
  activityType: string;
  item: unknown;
}) {
  const o =
    typeof item === 'object' && item !== null
      ? (item as Record<string, unknown>)
      : {};

  switch (activityType) {
    case 'HURUF_GAMBAR_MATCHING':
      return (
        <MiniCardShell title={`Huruf: ${String(o.huruf ?? '—')}`}>
          <div className="flex items-center gap-3">
            <span className="text-5xl">
              {emojiForKey(String(o.gambarKey ?? ''))}
            </span>
            <span className="text-sm">{String(o.gambarLabel ?? '')}</span>
          </div>
        </MiniCardShell>
      );
    case 'SUSUN_SUKU_KATA':
      return (
        <MiniCardShell title="Susun kata">
          <span className="text-5xl">
            {emojiForKey(String(o.gambarKey ?? ''))}
          </span>
          <p className="text-sm font-semibold">{String(o.gambarLabel ?? '')}</p>
          <p className="text-xs text-neutral-600">
            → {String(o.targetKata ?? '')}
          </p>
          <p className="mt-2 text-[11px] text-neutral-500">
            {Array.isArray(o.sukuKataKepingan) ? o.sukuKataKepingan.length : 0}{' '}
            keping
          </p>
        </MiniCardShell>
      );
    case 'BACA_KALIMAT_PENDEK': {
      const kal = String(o.kalimat ?? '');
      return (
        <MiniCardShell title="Baca">
          <p className="text-sm">
            {kal.length > 140 ? `${kal.slice(0, 140)}…` : kal}
          </p>
          <div className="mt-2 flex gap-2 text-2xl">
            <span title="benar">
              {emojiForKey(String(o.gambarBenar ?? ''))}
            </span>
            <span className="text-xs text-neutral-500">vs salah</span>
          </div>
        </MiniCardShell>
      );
    }
    case 'HITUNG_BENDA':
      return (
        <MiniCardShell title="Hitung">
          <span className="text-5xl">
            {emojiForKey(String(o.bendaKey ?? ''))}
          </span>
          <p className="text-sm">{String(o.bendaLabel ?? '')}</p>
          <p className="text-2xl font-bold">× {String(o.jumlah ?? '')}</p>
        </MiniCardShell>
      );
    case 'BANDINGKAN_LEBIH_KURANG':
      return (
        <MiniCardShell title={String(o.mode ?? 'banding')}>
          <div className="flex justify-between gap-2 text-2xl">
            <span>
              {emojiForKey(
                String((o.kiri as { bendaKey?: string })?.bendaKey ?? ''),
              )}
              ×{String((o.kiri as { jumlah?: number })?.jumlah ?? '')}
            </span>
            <span>
              {emojiForKey(
                String((o.kanan as { bendaKey?: string })?.bendaKey ?? ''),
              )}
              ×{String((o.kanan as { jumlah?: number })?.jumlah ?? '')}
            </span>
          </div>
        </MiniCardShell>
      );
    case 'PENJUMLAHAN_VISUAL':
      return (
        <MiniCardShell title="Tambah">
          <div className="flex flex-wrap items-center gap-1 text-2xl">
            {Array.from(
              { length: Number((o as { a?: number }).a ?? 0) },
              (_, i) => (
                <span key={`a-${i}`}>
                  {emojiForKey(String(o.bendaKey ?? ''))}
                </span>
              ),
            )}
            <span className="px-1">+</span>
            {Array.from(
              { length: Number((o as { b?: number }).b ?? 0) },
              (_, i) => (
                <span key={`b-${i}`}>
                  {emojiForKey(String(o.bendaKey ?? ''))}
                </span>
              ),
            )}
          </div>
        </MiniCardShell>
      );
    case 'PENGURANGAN_VISUAL':
      return (
        <MiniCardShell title="Kurang">
          <p className="text-lg font-bold">
            {String((o as { a?: number }).a ?? 0)} −{' '}
            {String((o as { b?: number }).b ?? 0)}
          </p>
          <span className="text-3xl">
            {emojiForKey(String(o.bendaKey ?? ''))}
          </span>
        </MiniCardShell>
      );
    default:
      return (
        <MiniCardShell title="Item">
          <pre className="max-h-32 overflow-auto text-[10px] text-neutral-600">
            {JSON.stringify(item, null, 2)}
          </pre>
        </MiniCardShell>
      );
  }
}

function MiniCardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
