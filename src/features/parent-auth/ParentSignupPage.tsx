import { Button } from '@/components/ui/Button';
import { apiBaseURL } from '@/lib/api-base-url';
import { authClient } from '@/lib/auth-client';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

type Props = { onBack: () => void };

export function ParentSignupPage({ onBack }: Props) {
  const [name, setName] = useState('');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        const msg = /exists|duplicate|already|terdaftar/i.test(
          `${res.error.message ?? ''}${res.error.code ?? ''}`,
        )
          ? 'Email ini sudah terdaftar. Coba Masuk atau gunakan email lain.'
          : (res.error.message ?? 'Data tidak valid.');
        setError(msg);
      } else {
        navigate({ to: '/' });
      }
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
            to="/auth/sign-in"
            className="text-sm font-semibold text-neutral-500 hover:text-primary-600"
          >
            Punya akun?
          </Link>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-neutral-900">
          Daftar orang tua
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Anda bisa menambah hingga <strong>maksimal 4 profil anak</strong>{' '}
          dibawah satu akun.
        </p>

        {googleOAuth ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="secondary"
              className="flex w-full items-center justify-center gap-2 py-3 font-semibold"
              disabled={loading}
              onClick={() => void googleSignIn()}
            >
              <span>Gabung atau masuk dengan Google</span>
            </Button>
            <div className="my-6 flex items-center gap-3 text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-medium uppercase">atau email</span>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSignup(e)} className="space-y-4">
          <div>
            <label
              htmlFor="ps-name"
              className="mb-1 block text-sm font-semibold text-neutral-700"
            >
              Nama Anda
            </label>
            <input
              id="ps-name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="ps-email"
              className="mb-1 block text-sm font-semibold text-neutral-700"
            >
              Email
            </label>
            <input
              id="ps-email"
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
              htmlFor="ps-password"
              className="mb-1 block text-sm font-semibold text-neutral-700"
            >
              Kata sandi (min. 8 karakter)
            </label>
            <input
              id="ps-password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p className="text-xs text-neutral-500">
            Dengan mendaftar, Anda menyatakan sebagai wali atas penggunaan
            aplikasi ini oleh anak.
          </p>
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
            {loading ? 'Memuat…' : 'Buat akun'}
          </Button>
        </form>
      </div>
    </div>
  );
}
