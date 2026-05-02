import { api } from '@/api';
import { applyDevicePreferencesToGameFeedback } from '@/lib/game-feedback-sync';
import { useEffect } from 'react';

/** Tarik preferensi singleton perangkat (orang tua) agar SFX / motion mengikuti pengaturan API. */
export function GameFeedbackSync() {
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const p = await api.getDevicePreferences();
        if (cancelled) return;
        applyDevicePreferencesToGameFeedback(p);
      } catch {
        /* offline / API down — biarkan localStorage terakhir */
      }
    }

    sync();
    const onFocus = () => sync();
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return null;
}
