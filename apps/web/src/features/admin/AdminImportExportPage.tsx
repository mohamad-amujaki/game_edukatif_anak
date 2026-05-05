import { type AdminLevelRow, adminApi } from '@/api-admin';
import { authClient } from '@/lib/auth-client';
import { Button } from '@mainceria/ui';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

export function AdminImportExportPage() {
  const { data: session } = authClient.useSession();
  const canEdit =
    session?.user?.role === 'super_admin' ||
    session?.user?.role === 'content_editor';

  const [levels, setLevels] = useState<AdminLevelRow[]>([]);
  const [activityId, setActivityId] = useState('');
  const [importText, setImportText] = useState('');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [err, setErr] = useState<string | null>(null);
  const [detailMsg, setDetailMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getLevels()
      .then((L) => {
        setLevels(L);
        setActivityId((prev) => prev || L[0]?.activities[0]?.id || '');
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat level'),
      );
  }, []);

  const flatActs = useMemo(() => {
    const out: Array<{ id: string; label: string }> = [];
    for (const lv of levels) {
      for (const a of lv.activities) {
        out.push({
          id: a.id,
          label: `${lv.title} — ${a.title}`,
        });
      }
    }
    return out;
  }, [levels]);

  const downloadBank = async () => {
    if (!activityId) return;
    setErr(null);
    setOkMsg(null);
    try {
      const data = await adminApi.getExportBank(activityId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-${activityId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setOkMsg('Export bank diunduh.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Export gagal');
    }
  };

  const downloadAll = async () => {
    setErr(null);
    setOkMsg(null);
    try {
      const data = await adminApi.getExportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setOkMsg('Export penuh diunduh.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Export gagal');
    }
  };

  const runImport = async () => {
    if (!canEdit || !activityId) return;
    setErr(null);
    setDetailMsg(null);
    setOkMsg(null);
    let items: unknown;
    try {
      items = JSON.parse(importText) as unknown;
    } catch {
      setErr('JSON tidak valid.');
      return;
    }
    if (!Array.isArray(items)) {
      setErr('Import bank: JSON harus berupa array item.');
      return;
    }
    try {
      await adminApi.importBank({ activityId, items, mode });
      setOkMsg('Import berhasil.');
      setImportText('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import gagal';
      setErr(msg);
      const det = e as Error & { details?: unknown };
      if (det.details) setDetailMsg(JSON.stringify(det.details, null, 2));
    }
  };

  return (
    <div className="w-full space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Import / Export</h1>
        <p className="mt-1 text-neutral-600">
          Cadangkan konten atau impor bank soal (JSON). Import divalidasi per
          tipe aktivitas.
        </p>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {okMsg ? <p className="text-sm text-green-700">{okMsg}</p> : null}
      {detailMsg ? (
        <pre className="max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-900">
          {detailMsg}
        </pre>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Export cepat</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Unduh JSON (butuh role content_editor atau super_admin).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void downloadAll()}
          >
            Export semua konten
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Export bank per aktivitas</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-sm font-medium text-neutral-700">
              Aktivitas
            </span>
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
            >
              {flatActs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void downloadBank()}
          >
            Unduh bank JSON
          </Button>
        </div>
        {activityId ? (
          <p className="mt-3 text-xs text-neutral-500">
            Editor visual:{' '}
            <Link
              to="/admin/banks/$activityId"
              params={{ activityId }}
              className="text-primary-600 hover:underline"
            >
              /admin/banks/{activityId}
            </Link>
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Import bank (array JSON)</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Tempel array item yang sama dengan field bank aktivitas
          (pairs/questions).
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex flex-wrap items-center gap-4 text-sm">
            <span>Mode:</span>
            <select
              className="rounded-lg border border-neutral-200 px-2 py-1"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'replace' | 'append')}
              disabled={!canEdit}
            >
              <option value="replace">replace</option>
              <option value="append">append</option>
            </select>
          </label>
          <textarea
            className="min-h-[200px] w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs"
            placeholder="[ … ]"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            disabled={!canEdit}
            spellCheck={false}
          />
          {canEdit ? (
            <Button type="button" onClick={() => void runImport()}>
              Jalankan import
            </Button>
          ) : (
            <p className="text-sm text-neutral-500">
              Hanya content_editor / super_admin yang dapat mengimpor.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
