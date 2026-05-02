import { api } from '@/api';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

type Row = {
  id: string;
  name: string;
  imagePath: string;
  rarity: string;
  theme: string;
  earnedAt: string;
};

export function StickerAlbumPage({ childId }: { childId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStickers(childId)
      .then(setRows)
      .catch(() => setErr('Gagal memuat album'));
  }, [childId]);

  if (err) return <p className="p-6 text-center text-red-600">{err}</p>;

  return (
    <div className="space-y-4 px-4">
      <Link
        to="/p/$childId"
        params={{ childId }}
        className="text-sm font-semibold text-primary-600"
      >
        ← Kembali
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Album stiker
      </h1>
      <p className="text-sm text-neutral-600">
        Kumpulkan stiker setiap 10 bintang baru. Kerja bagus!
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
              className="flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow ring-1 ring-black/5"
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
  );
}
