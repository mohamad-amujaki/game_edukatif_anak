import { adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

export function AdminSettingsPage() {
  const { data: session } = authClient.useSession();
  const isSuper = session?.user?.role === 'super_admin';

  const [cap, setCap] = useState(30);
  const [breakMin, setBreakMin] = useState(20);
  const [locked, setLocked] = useState(false);
  const [superParent, setSuperParent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedParent, setSavedParent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const s = await adminApi.getSettings();
        if (cancelled) return;
        setCap(s.defaultDailyTimeCapMinutes);
        setBreakMin(s.defaultBreakReminderMinutes);
        setLocked(s.contentLockedForEdit);
        setErr(null);
        if (isSuper) {
          const p = await adminApi.getParentDeviceSettings();
          if (cancelled) return;
          setSuperParent(p.isSuperParent);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Gagal memuat pengaturan');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

  const save = async () => {
    if (!isSuper) return;
    setErr(null);
    setSaved(false);
    try {
      await adminApi.patchSettings({
        defaultDailyTimeCapMinutes: cap,
        defaultBreakReminderMinutes: breakMin,
        contentLockedForEdit: locked,
      });
      setSaved(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  const saveParentFlag = async () => {
    if (!isSuper) return;
    setErr(null);
    setSavedParent(false);
    try {
      await adminApi.patchParentDeviceSettings({
        isSuperParent: superParent,
      });
      setSavedParent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings global</h1>
        <p className="mt-1 text-neutral-600">
          Default untuk orang tua baru & kunci konten (panic button).
        </p>
      </div>

      {loading ? (
        <p className="text-neutral-500">Memuat…</p>
      ) : (
        <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {saved ? (
            <p className="text-sm text-green-700">
              Pengaturan global disimpan.
            </p>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">
              Batas waktu harian default (menit)
            </span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
              disabled={!isSuper}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">
              Pengingat istirahat default (menit)
            </span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
              value={breakMin}
              onChange={(e) => setBreakMin(Number(e.target.value))}
              disabled={!isSuper}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
              disabled={!isSuper}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-800">
              Kunci edit konten (hanya super_admin yang bisa menulis level/bank)
            </span>
          </label>

          {isSuper ? (
            <Button type="button" onClick={() => void save()}>
              Simpan pengaturan
            </Button>
          ) : (
            <p className="text-sm text-neutral-500">
              Hanya super_admin yang dapat mengubah pengaturan ini.
            </p>
          )}
        </div>
      )}

      {!loading ? (
        <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Orang tua (PIN perangkat)
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Mengaktifkan mode super-orang tua di{' '}
              <code className="rounded bg-neutral-100 px-1">/parent/super</code>{' '}
              (kelola profil anak lewat PIN).
            </p>
          </div>
          {savedParent ? (
            <p className="text-sm text-green-700">
              Pengaturan PIN perangkat disimpan.
            </p>
          ) : null}

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={superParent}
              onChange={(e) => setSuperParent(e.target.checked)}
              disabled={!isSuper}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-800">
              Izinkan super-orang tua (fitur lanjutan di area orang tua)
            </span>
          </label>

          {isSuper ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void saveParentFlag()}
            >
              Simpan pengaturan PIN
            </Button>
          ) : (
            <p className="text-sm text-neutral-500">
              Hanya super_admin yang dapat mengubah flag ini.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
