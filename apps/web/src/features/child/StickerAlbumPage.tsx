import { api } from '@/api';
import { Button } from '@mainceria/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';

export function StickerAlbumPage({ childId }: { childId: string }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { data: rows = [], error } = useQuery({
    queryKey: ['stickers', childId],
    queryFn: () => api.getStickers(childId),
  });

  const savePng = async () => {
    const el = printRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `album-stiker-${childId}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  if (error)
    return <p className="p-6 text-center text-red-600">Gagal memuat album</p>;

  return (
    <div className="space-y-4 px-4">
      <Link
        to="/p/$childId"
        params={{ childId }}
        className="text-sm font-semibold text-primary-600"
      >
        ← Kembali
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Album stiker
          </h1>
          <p className="text-sm text-neutral-600">
            Kumpulkan stiker setiap 10 bintang baru. Kerja bagus!
          </p>
        </div>
        {rows.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            disabled={exporting}
            onClick={() => void savePng()}
          >
            {exporting ? 'Menyimpan…' : 'Simpan gambar album'}
          </Button>
        ) : null}
      </div>

      <div ref={printRef} className="space-y-4 rounded-2xl bg-white p-4 shadow">
        <p className="text-center font-[family-name:var(--font-display)] text-lg font-bold text-neutral-800">
          Album stiker
        </p>
        {rows.length === 0 ? (
          <p className="text-neutral-600">
            Belum ada stiker — main dan kumpulkan bintang.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rows.map((s) => (
              <li
                key={`${s.id}-${s.earnedAt}`}
                className="flex flex-col items-center rounded-2xl bg-neutral-50 p-4 text-center ring-1 ring-black/5"
              >
                <img
                  src={s.imagePath}
                  alt=""
                  className="h-20 w-20 object-contain"
                  loading="lazy"
                />
                <p className="mt-2 font-semibold">{s.name}</p>
                <p className="text-xs text-neutral-500">{s.rarity}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
