import { Button } from '@/components/ui/Button';
import { apiBaseURL } from '@/lib/api-base-url';
import { authClient } from '@/lib/auth-client';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${apiBaseURL()}/api/admin-signup/open`, {
          credentials: 'include',
        });
        const j = (await r.json()) as { open?: boolean };
        if (!cancelled) setSignupOpen(Boolean(j.open));
      } catch {
        if (!cancelled) setSignupOpen(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        setError(
          res.error.message ||
            'Gagal mendaftar. Mungkin sudah ada admin atau data tidak valid.',
        );
      } else {
        navigate({ to: '/admin' });
      }
    } catch {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  if (signupOpen === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <p className="text-neutral-600">
          Memeriksa ketersediaan pendaftaran...
        </p>
      </div>
    );
  }

  if (!signupOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-200 text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Pendaftaran admin tertutup
          </h1>
          <p className="text-neutral-600 mb-6">
            Sudah ada akun admin. Gunakan halaman masuk, atau minta super admin
            menambahkan akun baru untuk Anda.
          </p>
          <Link
            to="/admin/login"
            className="inline-block rounded-xl bg-primary-600 text-white px-6 py-3 font-semibold hover:bg-primary-700"
          >
            Ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 font-[family-name:var(--font-display)]">
            Admin pertama
          </h1>
          <p className="text-neutral-600 mt-2">
            Buat akun super admin (sekali per database kosong)
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label
              htmlFor="su-name"
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              Nama
            </label>
            <input
              id="su-name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama tampilan"
            />
          </div>
          <div>
            <label
              htmlFor="su-email"
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              Email
            </label>
            <input
              id="su-email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="su-password"
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              Password
            </label>
            <input
              id="su-password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-4 text-lg font-bold"
            disabled={loading}
          >
            {loading ? 'Membuat akun...' : 'Daftar & masuk'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-neutral-500">
          Sudah punya akun?{' '}
          <Link
            to="/admin/login"
            className="text-primary-600 font-semibold hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
