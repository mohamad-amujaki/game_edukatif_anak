import { Button } from '@/components/ui/Button';
import { HomeLanding } from '@/features/home/HomeLanding';
import { useSession } from '@/lib/auth-client';
import { BRAND_APP } from '@/lib/brand';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

/** Persist pilihan "lanjut tamu" sampai orang tua login. */
export const KID_CONTINUE_AS_GUEST_KEY = 'main-ceria-continue-as-guest';

function KidWelcomeChoose({
  onGuest,
  onSignUp,
  onSignIn,
}: {
  onGuest: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-[2rem] bg-gradient-to-br from-primary-50 to-literasi-50 p-8 text-center shadow-lg ring-1 ring-black/5">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-primary-700">
          Selamat datang di {BRAND_APP}
        </h1>
        <p className="mt-4 text-neutral-700">
          Buat akun orang tua agar progres hingga{' '}
          <strong>maksimal 4 profil anak</strong> bisa ikut ketika Anda ganti
          perangkat. Atau lanjut sebagai tamu — progres tertaut ke peramban
          perangkat ini melalui cookie (bukan ke akun email Anda).
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          className="w-full py-4 text-lg"
          onClick={onSignUp}
        >
          Daftar (email &amp; kata sandi)
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full py-4 text-lg"
          onClick={onSignIn}
        >
          Masuk
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full py-4 text-neutral-700 ring-1 ring-neutral-300"
          onClick={onGuest}
        >
          Lanjut sebagai tamu
        </Button>
      </div>
      <p className="mt-8 text-center text-sm text-neutral-500">
        Staf konten/internal?{' '}
        <Link
          to="/admin/login"
          className="font-semibold text-primary-600 underline"
        >
          Masuk panel admin
        </Link>
      </p>
    </div>
  );
}

/** Gerbang pembuka orang tua (PR §8.1): akun bermain atau tamu, lalu beranda pemilih profil. */
export function KidWelcomeGate() {
  const navigate = useNavigate();
  const { data: sess, isPending } = useSession();
  const [guestOk, setGuestOk] = useState(() => {
    try {
      return sessionStorage.getItem(KID_CONTINUE_AS_GUEST_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (sess?.user?.role === 'parent') {
      try {
        sessionStorage.removeItem(KID_CONTINUE_AS_GUEST_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [sess?.user?.role]);

  const choseGuest = () => {
    try {
      sessionStorage.setItem(KID_CONTINUE_AS_GUEST_KEY, '1');
    } catch {
      /* ignore */
    }
    setGuestOk(true);
  };

  if (sess?.user?.role === 'parent') {
    return <HomeLanding />;
  }

  if (guestOk) {
    return <HomeLanding />;
  }

  if (isPending) {
    return <p className="p-10 text-center text-neutral-600">Memeriksa sesi…</p>;
  }

  return (
    <KidWelcomeChoose
      onGuest={choseGuest}
      onSignUp={() => navigate({ to: '/auth/sign-up' })}
      onSignIn={() => navigate({ to: '/auth/sign-in' })}
    />
  );
}
