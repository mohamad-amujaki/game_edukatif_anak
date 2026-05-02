import { type AdminAuditRow, adminApi } from '@/api-admin';
import { authClient } from '@/lib/auth-client';
import { Fragment, useCallback, useEffect, useState } from 'react';

type AuditQueryOpts = {
  fromLocal: string;
  toLocal: string;
  entityType: string;
  actorTypeFilter: '' | 'ADMIN' | 'SUPER_PARENT';
  isSuper: boolean;
};

type AuditQueryBuild =
  | { ok: true; params: Parameters<typeof adminApi.getAuditLog>[0] }
  | { ok: false; error: string };

function buildAuditQuery(opts: AuditQueryOpts): AuditQueryBuild {
  const { fromLocal, toLocal, entityType, actorTypeFilter, isSuper } = opts;
  if (fromLocal && toLocal && new Date(fromLocal) > new Date(toLocal)) {
    return {
      ok: false,
      error: 'Rentang waktu tidak valid (awal harus sebelum akhir).',
    };
  }
  const q: NonNullable<Parameters<typeof adminApi.getAuditLog>[0]> = {};
  if (fromLocal) q.from = new Date(fromLocal).toISOString();
  if (toLocal) q.to = new Date(toLocal).toISOString();
  if (isSuper) {
    if (entityType.trim()) q.entityType = entityType.trim();
    if (actorTypeFilter) q.actorType = actorTypeFilter;
  }
  const params = Object.keys(q).length > 0 ? q : undefined;
  return { ok: true, params };
}

export function AdminAuditPage() {
  const { data: session } = authClient.useSession();
  const isSuper = session?.user?.role === 'super_admin';

  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [entityType, setEntityType] = useState('');
  const [actorTypeFilter, setActorTypeFilter] = useState<
    '' | 'ADMIN' | 'SUPER_PARENT'
  >('');
  const [fromLocal, setFromLocal] = useState('');
  const [toLocal, setToLocal] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setErr(null);
    const built = buildAuditQuery({
      fromLocal,
      toLocal,
      entityType,
      actorTypeFilter,
      isSuper,
    });
    if (!built.ok) {
      setErr(built.error);
      return;
    }
    adminApi
      .getAuditLog(built.params)
      .then(setRows)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat audit'),
      );
  }, [actorTypeFilter, entityType, fromLocal, isSuper, toLocal]);

  const clearFilters = useCallback(() => {
    setEntityType('');
    setActorTypeFilter('');
    setFromLocal('');
    setToLocal('');
    setExpanded(null);
    setErr(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit log</h1>
        <p className="mt-1 text-neutral-600">
          {isSuper
            ? 'Semua jejak perubahan admin.'
            : 'Hanya aktivitas Anda yang ditampilkan.'}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">
            Dari (waktu lokal)
          </span>
          <input
            type="datetime-local"
            className="mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={fromLocal}
            onChange={(e) => setFromLocal(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">
            Sampai (waktu lokal)
          </span>
          <input
            type="datetime-local"
            className="mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={toLocal}
            onChange={(e) => setToLocal(e.target.value)}
          />
        </label>
        {isSuper ? (
          <>
            <label className="block">
              <span className="text-xs font-medium text-neutral-500">
                Filter entityType
              </span>
              <input
                className="mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="mis. ChildProfile"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-neutral-500">
                Tipe actor
              </span>
              <select
                className="mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                value={actorTypeFilter}
                onChange={(e) =>
                  setActorTypeFilter(
                    e.target.value as '' | 'ADMIN' | 'SUPER_PARENT',
                  )
                }
              >
                <option value="">Semua</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_PARENT">SUPER_PARENT</option>
              </select>
            </label>
          </>
        ) : null}
        <button
          type="button"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          onClick={() => load()}
        >
          Muat ulang
        </button>
        <button
          type="button"
          className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          onClick={() => clearFilters()}
        >
          Hapus filter
        </button>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Waktu</th>
              <th className="px-4 py-3 font-semibold">Tipe actor</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-b border-neutral-50 align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-neutral-600">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-neutral-700">
                    {r.actorType}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-4 py-2 text-xs">
                    {r.entityType}
                    <span className="text-neutral-400"> · </span>
                    <span className="break-all">{r.entityId}</span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {r.actorEmail ?? r.actorId}
                  </td>
                  <td className="px-4 py-2">
                    {(r.beforeJson || r.afterJson) && (
                      <button
                        type="button"
                        className="text-xs font-medium text-primary-600 hover:underline"
                        onClick={() =>
                          setExpanded(expanded === r.id ? null : r.id)
                        }
                      >
                        {expanded === r.id ? 'Sembunyikan' : 'Diff'}
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === r.id ? (
                  <tr key={`${r.id}-diff`} className="bg-neutral-50">
                    <td colSpan={6} className="px-4 py-3">
                      <pre className="max-h-48 overflow-auto text-xs">
                        {r.beforeJson ? (
                          <>
                            <span className="font-semibold">before:</span>
                            {'\n'}
                            {r.beforeJson}
                            {'\n\n'}
                          </>
                        ) : null}
                        {r.afterJson ? (
                          <>
                            <span className="font-semibold">after:</span>
                            {'\n'}
                            {r.afterJson}
                          </>
                        ) : null}
                      </pre>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ? (
          <p className="px-4 py-8 text-center text-neutral-400">
            Belum ada entri.
          </p>
        ) : null}
      </div>
    </div>
  );
}
