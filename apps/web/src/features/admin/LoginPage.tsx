import { authClient } from '@/lib/auth-client';
import { Button } from '@mainceria/ui';
import { BRAND_ADMIN } from '@mainceria/utils';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
          res.error.message ||
            'Gagal masuk. Periksa kembali email dan password.',
        );
      } else {
        const d = res.data;
        const need =
          d &&
          typeof d === 'object' &&
          'twoFactorRedirect' in d &&
          Boolean((d as { twoFactorRedirect?: boolean }).twoFactorRedirect);
        if (need) {
          navigate({ to: '/admin/two-factor' });
        } else {
          navigate({ to: '/admin' });
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-neutral-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 font-[family-name:var(--font-display)]">
            {BRAND_ADMIN}
          </h1>
          <p className="text-neutral-600 mt-2">
            Masuk ke panel kontrol internal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            {loading ? 'Memverifikasi...' : 'Masuk Panel'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-neutral-500">
          <Link
            to="/admin/signup"
            className="text-primary-600 font-semibold hover:underline"
          >
            Daftar admin pertama
          </Link>
          {' · '}
          Lupa password? Hubungi tech lead atau super admin.
        </p>
      </div>
    </div>
  );
}
