import { adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

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
  const [totpPw, setTotpPw] = useState('');
  const [pendingTotpUri, setPendingTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [totpErr, setTotpErr] = useState<string | null>(null);
  const [totpBusy, setTotpBusy] = useState(false);
  const [disablePw, setDisablePw] = useState('');

  const twoFactorEnabled = Boolean(
    session?.user &&
      'twoFactorEnabled' in session.user &&
      (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled,
  );

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
    <div className="w-full space-y-6">
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

      {isSuper ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              2FA (TOTP) — super_admin
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Disarankan untuk akun utama. Gunakan aplikasi authenticator
              (Google Authenticator, 1Password, dll.).
            </p>
          </div>
          {totpErr ? <p className="text-sm text-red-600">{totpErr}</p> : null}

          {twoFactorEnabled ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-emerald-800">
                Two-factor aktif untuk akun ini.
              </p>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
                placeholder="Password untuk mematikan 2FA"
                value={disablePw}
                onChange={(e) => setDisablePw(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={disablePw.length < 4 || totpBusy}
                onClick={async () => {
                  setTotpErr(null);
                  setTotpBusy(true);
                  try {
                    const r = await authClient.twoFactor.disable({
                      password: disablePw,
                    });
                    if (r.error) {
                      setTotpErr(r.error.message ?? 'Gagal mematikan');
                      setTotpBusy(false);
                      return;
                    }
                    window.location.reload();
                  } finally {
                    setTotpBusy(false);
                  }
                }}
              >
                Matikan 2FA
              </Button>
            </div>
          ) : pendingTotpUri ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-700">
                Scan QR di aplikasi autentikasi, lalu masukkan kode 6 digit
                untuk menyelesaikan pengaktifan.
              </p>
              <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-100">
                <QRCode value={pendingTotpUri} size={176} />
              </div>
              {backupCodes.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-neutral-600">
                    Kode cadangan (simpan offline)
                  </p>
                  <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
                    {backupCodes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <input
                inputMode="numeric"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-center font-mono text-xl tracking-widest"
                maxLength={8}
                placeholder="Kode TOTP"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))
                }
              />
              <Button
                type="button"
                disabled={totpCode.length < 6 || totpBusy}
                onClick={async () => {
                  setTotpErr(null);
                  setTotpBusy(true);
                  try {
                    const r = await authClient.twoFactor.verifyTotp({
                      code: totpCode,
                      trustDevice: false,
                    });
                    if (r.error) {
                      setTotpErr(r.error.message ?? 'Kode salah');
                      setTotpBusy(false);
                      return;
                    }
                    window.location.reload();
                  } finally {
                    setTotpBusy(false);
                  }
                }}
              >
                Konfirmasi dan aktifkan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
                placeholder="Password akun untuk mulai aktivasi TOTP"
                value={totpPw}
                onChange={(e) => setTotpPw(e.target.value)}
              />
              <Button
                type="button"
                disabled={totpPw.length < 4 || totpBusy}
                onClick={async () => {
                  setTotpErr(null);
                  setTotpBusy(true);
                  try {
                    const r = await authClient.twoFactor.enable({
                      password: totpPw,
                    });
                    if (r.error) {
                      setTotpErr(r.error.message ?? 'Gagal');
                      setTotpBusy(false);
                      return;
                    }
                    const d = r.data as {
                      totpURI?: string;
                      backupCodes?: string[];
                    };
                    if (d?.totpURI) {
                      setPendingTotpUri(d.totpURI);
                      setBackupCodes(
                        Array.isArray(d.backupCodes) ? d.backupCodes : [],
                      );
                      setTotpPw('');
                    } else {
                      setTotpErr('Respons server tidak berisi URI TOTP.');
                    }
                  } finally {
                    setTotpBusy(false);
                  }
                }}
              >
                Aktifkan 2FA (TOTP)
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
