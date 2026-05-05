import { authClient } from '@/lib/auth-client';
import { Button } from '@mainceria/ui';
import { BRAND_ADMIN } from '@mainceria/utils';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export function AdminTwoFactorPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [trust, setTrust] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: code.replace(/\s/g, ''),
        trustDevice: trust,
      });
      if (res.error) {
        setErr(res.error.message || 'Kode tidak valid.');
        setLoading(false);
        return;
      }
      navigate({ to: '/admin' });
    } catch {
      setErr('Gagal memverifikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
        <h1 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-primary-600">
          {BRAND_ADMIN}
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Verifikasi dua faktor (TOTP dari aplikasi autentikasi).
        </p>
        <form className="mt-6 space-y-4" onSubmit={(e) => void submit(e)}>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Kode 6 digit
            </span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              className="mt-1 w-full rounded-xl border px-4 py-3 text-center font-mono text-2xl tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={trust}
              onChange={(e) => setTrust(e.target.checked)}
            />
            Ingat perangkat ini (30 hari)
          </label>
          {err ? (
            <p className="text-sm font-medium text-red-600">{err}</p>
          ) : null}
          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? 'Memverifikasi…' : 'Masuk'}
          </Button>
        </form>
        <button
          type="button"
          className="mt-6 w-full text-center text-sm text-neutral-600 underline"
          onClick={() =>
            void authClient
              .signOut()
              .then(() => navigate({ to: '/admin/login' }))
          }
        >
          Keluar dan coba login lagi
        </button>
      </div>
    </div>
  );
}
