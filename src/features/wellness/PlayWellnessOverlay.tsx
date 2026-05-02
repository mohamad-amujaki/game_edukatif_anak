import { Button } from '@/components/ui/Button';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storagePlaySecKey(childId: string): string {
  return `wellness_play_sec_${childId}_${todayKey()}`;
}

function storageBreakKey(childId: string): string {
  return `wellness_break_base_${childId}_${todayKey()}`;
}

type Props = {
  childId: string;
  dailyCapMinutes: number;
  breakReminderMinutes: number;
};

/**
 * Akumulasi waktu aktif di halaman bermain (timer saat komponen terpasang).
 * Reminder istirahat & batas harian mengikuti PRD wellness (singleton pengaturan orang tua).
 */
export function PlayWellnessOverlay({
  childId,
  dailyCapMinutes,
  breakReminderMinutes,
}: Props) {
  const capSec = Math.max(1, dailyCapMinutes) * 60;
  const breakEverySec = Math.max(1, breakReminderMinutes) * 60;

  const keys = useMemo(
    () => ({
      play: storagePlaySecKey(childId),
      brk: storageBreakKey(childId),
    }),
    [childId],
  );

  const [playSec, setPlaySec] = useState(() => {
    if (typeof sessionStorage === 'undefined') return 0;
    const prev = Number(sessionStorage.getItem(keys.play) ?? '0');
    const safe = Number.isFinite(prev) && prev >= 0 ? prev : 0;
    return safe;
  });
  const [showBreak, setShowBreak] = useState(false);
  const [capReached, setCapReached] = useState(
    () =>
      typeof sessionStorage !== 'undefined' &&
      Number(sessionStorage.getItem(keys.play) ?? '0') >= capSec,
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaySec((s) => {
        const next = s + 1;
        sessionStorage.setItem(keys.play, String(next));
        if (next >= capSec) setCapReached(true);

        const base = Number(sessionStorage.getItem(keys.brk) ?? '0');
        if (
          breakEverySec > 0 &&
          s - base < breakEverySec &&
          next - base >= breakEverySec
        ) {
          setShowBreak(true);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [keys.play, keys.brk, breakEverySec, capSec]);

  const dismissBreak = () => {
    sessionStorage.setItem(keys.brk, String(playSec));
    setShowBreak(false);
  };

  if (capReached) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 p-6 text-center text-white">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Waktu bermain hari ini sudah cukup
        </p>
        <p className="mt-2 max-w-sm text-sm text-white/90">
          Istirahat dulu ya — besok kita lanjut lagi.
        </p>
        <Link
          to="/p/$childId"
          params={{ childId }}
          className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-semibold text-primary-700"
        >
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  if (showBreak) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6">
        <div className="max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-primary-700">
            Waktu istirahat
          </p>
          <p className="mt-2 text-neutral-600">
            Minum air, gerakkan badan sebentar, lalu lanjut main kalau sudah
            siap.
          </p>
          <Button className="mt-4 w-full" onClick={dismissBreak}>
            Lanjut bermain
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
