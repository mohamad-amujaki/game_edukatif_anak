import { Button } from '@/components/ui/Button';
import { BRAND_APP } from '@/lib/brand';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

type Props = { childId: string };

/**
 * Tutorial ringkas sesudah profil dibuat (PRD onboarding): tap, geser, lalu mulai.
 */
export function OnboardingFlowPage({ childId }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const finish = () => {
    try {
      localStorage.setItem(`onboarding-done-${childId}`, '1');
    } catch {
      /* ignore */
    }
    navigate({ to: '/p/$childId', params: { childId } });
  };

  return (
    <div className="space-y-6 px-4 pb-8">
      <p className="text-center text-sm font-semibold text-primary-600">
        Langkah {step + 1} / 4
      </p>

      {step === 0 ? (
        <div className="rounded-3xl bg-primary-50 p-6 text-center shadow-inner">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary-700">
            Selamat datang di {BRAND_APP}!
          </p>
          <p className="mt-3 text-neutral-700">
            Kamu akan bermain sambil belajar huruf, kata, dan berhitung. Ikuti
            penjelasan singkat ini dulu.
          </p>
          <Button className="mt-6 w-full" onClick={() => setStep(1)}>
            Lanjut
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-black/5">
          <p className="font-semibold text-neutral-900">Ketuk tombol & kartu</p>
          <p className="mt-2 text-neutral-600">
            Sentuh sekali untuk memilih jawaban atau membuka level. Pakai satu
            jari saja — tidak perlu cepat-cepat.
          </p>
          <Button
            type="button"
            className="mt-6 w-full py-6 text-xl"
            onClick={() => setStep(2)}
          >
            Coba ketuk di sini
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-3xl bg-literasi-50 p-6 shadow-inner">
          <p className="font-semibold text-neutral-900">Geser / seret (drag)</p>
          <p className="mt-2 text-neutral-600">
            Di beberapa permainan kamu akan menarik kartu atau huruf ke tempat
            yang benar. Tahan lalu geser dengan pelan — boleh mencoba beberapa
            kali.
          </p>
          <Button className="mt-6 w-full" onClick={() => setStep(3)}>
            Mengerti
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="rounded-3xl bg-math-50 p-6 text-center shadow-inner">
          <p className="font-semibold text-neutral-900">Siap!</p>
          <p className="mt-2 text-neutral-600">
            Orang tua bisa mengatur PIN dan batas waktu bermain di menu{' '}
            <strong>Orang tua</strong>. Sekarang pilih quest atau jalur di
            beranda.
          </p>
          <Button className="mt-6 w-full" onClick={finish}>
            Mulai belajar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
