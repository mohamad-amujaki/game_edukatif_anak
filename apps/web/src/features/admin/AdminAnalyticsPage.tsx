import { adminApi } from '@/api-admin';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function AdminAnalyticsPage() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminApi.getOverview>
  > | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getOverview()
      .then(setData)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat analytics'),
      );
  }, []);

  const retentionChart = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: `D1 (n=${data.retentionCohortD1})`,
        pct: typeof data.retentionD1Pct === 'number' ? data.retentionD1Pct : 0,
      },
      {
        key: `D7 (n=${data.retentionCohortD7})`,
        pct: typeof data.retentionD7Pct === 'number' ? data.retentionD7Pct : 0,
      },
    ];
  }, [data]);

  const levelBars = useMemo(() => {
    if (!data) return [];
    return data.levelCompletion.slice(0, 16).map((r) => ({
      label: `${r.ageMode} ${r.track === 'literasi' ? 'L' : 'M'}${String(r.order)}`,
      pct: r.masteredPct,
    }));
  }, [data]);

  const starsBars = useMemo(() => {
    if (!data) return [];
    return data.avgStarsByActivity.slice(0, 16).map((r) => ({
      label: r.title.length > 20 ? `${r.title.slice(0, 18)}…` : r.title,
      avg: r.avgStars,
    }));
  }, [data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-1 text-neutral-600">
          Ringkasan metrik MVP: aktivitas, retensi, penyelesaian level, dan
          waktu bermain.
        </p>
        {data?._cached ? (
          <p className="mt-1 text-xs text-neutral-400">
            Data dari cache (≤5 menit).
          </p>
        ) : null}
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      {data ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            DAU vs MAU (grafik sederhana)
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Perbandingan pengguna unik hari ini vs 30 hari terakhir.
          </p>
          <div className="mt-6 w-full max-w-4xl space-y-5">
            <MiniBar
              label="DAU hari ini"
              value={data.dauToday}
              max={Math.max(data.dauToday, data.mau30d, 1)}
            />
            <MiniBar
              label="MAU (30 hari)"
              value={data.mau30d}
              max={Math.max(data.dauToday, data.mau30d, 1)}
            />
          </div>
        </section>
      ) : null}

      {data ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">
              Retensi kohort (%)
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              D1/D7 dari metrik backend (null → ditampilkan 0 di grafik).
            </p>
            <div className="mt-4 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    dataKey="key"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Bar
                    dataKey="pct"
                    fill="#6366f1"
                    name="%"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">
              Penyelesaian level (% anak eligible)
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Sampai 16 level pertama (urutan kurikulum).
            </p>
            <div className="mt-4 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={levelBars}
                  margin={{ left: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={52}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="pct"
                    fill="#0d9488"
                    name="%"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-neutral-900">
              Rata-rata bintang per aktivitas (peringkat percobaan)
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Top 16 berdasarkan jumlah percobaan di metrik overview.
            </p>
            <div className="mt-4 h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={starsBars}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 3]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="avg"
                    fill="#d97706"
                    name="★"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="DAU (hari ini)" value={data?.dauToday} />
        <MetricCard label="MAU (30 hari)" value={data?.mau30d} />
        <MetricCard
          label="Retensi D1"
          value={
            data?.retentionD1Pct == null
              ? '—'
              : `${data.retentionD1Pct}% (n=${data.retentionCohortD1})`
          }
        />
        <MetricCard
          label="Retensi D7"
          value={
            data?.retentionD7Pct == null
              ? '—'
              : `${data.retentionD7Pct}% (n=${data.retentionCohortD7})`
          }
        />
        <MetricCard
          label="Total waktu main"
          value={
            data != null ? `${data.totalPlayTimeMinutes} menit` : undefined
          }
        />
        <MetricCard
          label="Rata-rata bintang (global)"
          value={data?.avgStarsGlobal}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-neutral-900">
          Penyelesaian per level
        </h2>
        <p className="text-sm text-neutral-500">
          Persentase anak (mode usia sama) yang menguasai level.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Track</th>
                <th className="px-4 py-3 font-semibold text-right">Mastered</th>
                <th className="px-4 py-3 font-semibold text-right">Eligible</th>
                <th className="px-4 py-3 font-semibold text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {(data?.levelCompletion ?? []).map((row) => (
                <tr key={row.levelId} className="border-b border-neutral-50">
                  <td className="px-4 py-2">{row.title}</td>
                  <td className="px-4 py-2">{row.ageMode}</td>
                  <td className="px-4 py-2">{row.track}</td>
                  <td className="px-4 py-2 text-right">{row.mastered}</td>
                  <td className="px-4 py-2 text-right">
                    {row.eligibleChildren}
                  </td>
                  <td className="px-4 py-2 text-right">{row.masteredPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.levelCompletion.length === 0 ? (
            <p className="px-4 py-6 text-center text-neutral-400">
              Belum ada data level.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-neutral-900">
          Rata-rata bintang per aktivitas
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Aktivitas</th>
                <th className="px-4 py-3 font-semibold text-right">
                  Rata bintang
                </th>
                <th className="px-4 py-3 font-semibold text-right">
                  Percobaan
                </th>
              </tr>
            </thead>
            <tbody>
              {(data?.avgStarsByActivity ?? []).map((row) => (
                <tr key={row.activityId} className="border-b border-neutral-50">
                  <td className="px-4 py-2">{row.title}</td>
                  <td className="px-4 py-2 text-right">{row.avgStars}</td>
                  <td className="px-4 py-2 text-right">{row.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.avgStarsByActivity.length === 0 ? (
            <p className="px-4 py-6 text-center text-neutral-400">
              Belum ada progress aktivitas.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MiniBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm text-neutral-600">
        <span>{label}</span>
        <span className="tabular-nums font-medium">{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-primary-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">
        {value === undefined ? '…' : String(value)}
      </p>
    </div>
  );
}
