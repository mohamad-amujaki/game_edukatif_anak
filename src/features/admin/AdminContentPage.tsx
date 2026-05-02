import { type AdminLevelRow, adminApi } from '@/api-admin';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function AdminContentPage() {
  const [levels, setLevels] = useState<AdminLevelRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getLevels()
      .then(setLevels)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat level'),
      );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Konten</h1>
        <p className="mt-1 text-neutral-600">
          Level dan aktivitas — edit metadata/payload atau bank soal per
          aktivitas.
        </p>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div className="space-y-8">
        {levels.map((lv) => (
          <section
            key={lv.id}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {lv.title}
              </h2>
              <p className="text-sm text-neutral-500">
                {lv.ageMode} · {lv.track} · urutan {lv.order} ·{' '}
                {lv._count.activities} aktivitas
              </p>
            </div>
            <ul className="divide-y divide-neutral-100">
              {lv.activities.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{a.title}</p>
                    <p className="text-xs text-neutral-500">
                      {a.type} · ~{a.estimatedSec}s
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/admin/content/activities/$activityId"
                      params={{ activityId: a.id }}
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
                    >
                      Edit aktivitas
                    </Link>
                    <Link
                      to="/admin/banks/$activityId"
                      params={{ activityId: a.id }}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Bank soal
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {lv.activities.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-neutral-400">
                Belum ada aktivitas di level ini.
              </p>
            ) : null}
          </section>
        ))}
      </div>
      {!err && levels.length === 0 ? (
        <p className="text-center text-neutral-400">Memuat…</p>
      ) : null}
    </div>
  );
}
