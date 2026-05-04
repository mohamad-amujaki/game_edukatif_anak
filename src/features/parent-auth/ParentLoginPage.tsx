import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { apiBaseURL } from '@/lib/api-base-url';
import { authClient } from '@/lib/auth-client';
import { isStaffAdminRole } from '@/lib/parent-app-roles';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

type Props = { onBack: () => void };

export function ParentLoginPage({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleOAuth, setGoogleOAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = apiBaseURL();
        let google = false;
        const rHealth = await fetch(`${base}/api/health`, {
          credentials: 'include',
        });
        if (rHealth.ok) {
          const h = (await rHealth.json()) as {
            data?: { googleOAuth?: boolean };
          };
          if (typeof h?.data?.googleOAuth === 'boolean') {
            google = h.data.googleOAuth;
          } else {
            const rFeat = await fetch(`${base}/api/app/features`, {
              credentials: 'include',
            });
            if (rFeat.ok) {
              const f = (await rFeat.json()) as {
                data?: { googleOAuth?: boolean };
              };
              google = Boolean(f?.data?.googleOAuth);
            }
          }
        }
        if (!cancelled) setGoogleOAuth(google);
      } catch {
        if (!cancelled) setGoogleOAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const googleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
      });
    } catch {
      setError('Gagal membuka login Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(
          res.error.message ?? 'Gagal masuk. Periksa email dan kata sandi.',
        );
        return;
      }

      const d = res.data;
      const twoFactorNeeded =
        d &&
        typeof d === 'object' &&
        'twoFactorRedirect' in d &&
        Boolean((d as { twoFactorRedirect?: boolean }).twoFactorRedirect);

      const sess = await authClient.getSession();
      const role = sess?.data?.user?.role ?? null;

      if (twoFactorNeeded && isStaffAdminRole(role)) {
        navigate({ to: '/admin/two-factor' });
        return;
      }
      if (isStaffAdminRole(role)) {
        navigate({ to: '/admin' });
        return;
      }

      // Parent app: setelah login, cek dulu profil anak milik akun ini.
      // Jika belum ada, user tetap masuk ke beranda untuk membuat profil baru
      // (maksimal 4 profil tetap dibatasi di UI + API).
      await api.getProfiles().catch(() => []);
      navigate({ to: '/' });
    } catch {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            className="text-sm font-semibold text-primary-600 hover:underline"
            onClick={onBack}
          >
            ← Kembali
          </button>
          <Link
            to="/auth/sign-up"
            className="text-sm font-semibold text-neutral-500 hover:text-primary-600"
          >
            Daftar
          </Link>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-neutral-900">
          Masuk orang tua
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Progres profil anak dikaitkan ke akun ini (hingga 4 profil).
        </p>

        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            className="flex w-full items-center justify-center gap-2 py-3 font-semibold"
            disabled={loading || !googleOAuth}
            onClick={() => void googleSignIn()}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" role="img">
              <title>Google</title>
              <path
                fill="#4285F4"
                d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.61 4.61 0 0 1-2 3.03v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.28Z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.24-2.51c-.9.6-2.06.96-3.37.96-2.59 0-4.78-1.75-5.56-4.1H3.1v2.58A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#FBBC05"
                d="M6.44 13.92A5.99 5.99 0 0 1 6.13 12c0-.66.12-1.29.31-1.92V7.5H3.1A10 10 0 0 0 2 12c0 1.61.39 3.13 1.1 4.5l3.34-2.58Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.98c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.95 2.94 14.7 2 12 2A10 10 0 0 0 3.1 7.5l3.34 2.58c.78-2.35 2.97-4.1 5.56-4.1Z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </Button>
          {!googleOAuth ? (
            <p className="mt-2 text-xs text-neutral-500">
              Login Google belum aktif. Isi `GOOGLE_CLIENT_ID` dan
              `GOOGLE_CLIENT_SECRET` di server.
            </p>
          ) : null}
          <div className="my-6 flex items-center gap-3 text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs font-medium uppercase">atau email</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
        </div>

        <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
          <div>
            <label
              htmlFor="pl-email"
              className="mb-1 block text-sm font-semibold text-neutral-700"
            >
              Email
            </label>
            <input
              id="pl-email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="pl-password"
              className="mb-1 block text-sm font-semibold text-neutral-700"
            >
              Kata sandi
            </label>
            <input
              id="pl-password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
          <Button
            type="submit"
            className="w-full py-4 text-lg font-bold"
            disabled={loading}
          >
            {loading ? 'Memuat…' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
}
