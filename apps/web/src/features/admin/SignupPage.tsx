import { Button } from '@mainceria/ui';
import { BRAND_ADMIN } from '@mainceria/utils';
import { Link } from '@tanstack/react-router';

/**
 * Bootstrap akun **`super_admin`** pertama hanya lewat CLI `pnpm admin:create`
 * — pendaftar publik better-auth kini untuk **orang tua** aplikasi bermain (`role: parent`).
 */
export function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-neutral-900">
          {BRAND_ADMIN}
        </h1>
        <p className="mt-4 text-neutral-600">
          Pembuatan admin pertama tidak lagi melalui formulir web. Jalankan dari
          root proyek:
        </p>
        <pre className="mt-4 rounded-2xl bg-neutral-900 p-4 text-left text-sm text-neutral-100">
          {`pnpm admin:create -- \\
  --email anda@domain.com \\
  --password 'KataSand1Kuat!'`}
        </pre>
        <p className="mt-4 text-sm text-neutral-500">
          Orang tua bermain menggunakan{' '}
          <Link
            to="/auth/sign-up"
            className="font-semibold text-primary-600 underline"
          >
            pendaftaran utama
          </Link>
          .
        </p>
        <Link to="/admin/login" className="mt-6 inline-block">
          <Button type="button" className="py-4">
            Ke halaman masuk admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
