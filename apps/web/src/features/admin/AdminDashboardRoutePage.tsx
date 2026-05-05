import { adminApi } from '@/api-admin';
import { BRAND_ADMIN } from '@mainceria/utils';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

function DashCard({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">
        {value === undefined ? '…' : String(value)}
      </p>
    </div>
  );
}

export default function AdminDashboardRoutePage() {
  const { data, error } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.getOverview(),
  });

  const err =
    error instanceof Error
      ? error.message
      : error
        ? 'Gagal memuat ringkasan'
        : null;

  const r1 =
    data?.retentionD1Pct == null
      ? '—'
      : `${data.retentionD1Pct}% · n=${data.retentionCohortD1}`;
  const r7 =
    data?.retentionD7Pct == null
      ? '—'
      : `${data.retentionD7Pct}% · n=${data.retentionCohortD7}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="mt-1 text-neutral-600">
          Lima metrik utama MVP + ringkasan pengguna.
        </p>
        {data?._cached ? (
          <p className="mt-1 text-xs text-neutral-400">
            Angka dari cache (≤5 menit).
          </p>
        ) : null}
      </div>
      {err ? <p className="text-red-600 text-sm">{err}</p> : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Metrik utama (PRD §7)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashCard label="DAU (hari ini)" value={data?.dauToday} />
          <DashCard label="MAU (30 hari)" value={data?.mau30d} />
          <DashCard label="Retensi D1" value={r1} />
          <DashCard label="Retensi D7" value={r7} />
          <DashCard
            label="Total waktu main"
            value={
              data != null ? `${data.totalPlayTimeMinutes} menit` : undefined
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Ringkasan
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard label="Total anak" value={data?.totalAnak} />
          <DashCard label="Total sesi main" value={data?.totalSessions} />
          <DashCard
            label="Rata-rata bintang (global)"
            value={data?.avgStarsGlobal}
          />
        </div>
      </section>

      <p className="text-sm text-neutral-500">
        Tabel penyelesaian level & bintang per aktivitas ada di halaman{' '}
        <Link
          to="/admin/analytics"
          className="font-medium text-primary-600 hover:underline"
        >
          Analytics
        </Link>
        .
      </p>
      <p className="italic text-neutral-500">
        Selamat datang di {BRAND_ADMIN}.
      </p>
    </div>
  );
}
