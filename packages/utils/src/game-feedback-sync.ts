/** Kunci localStorage — disinkron dari `ParentSettings` via API + simpan orang tua. */
export const LS_SFX = 'game-sfx-enabled';
export const LS_MUSIC = 'game-music-enabled';
export const LS_PARENT_RFM = 'game-parent-reduce-motion';

export type DevicePreferences = {
  dailyTimeCapMinutes: number;
  breakReminderMinutes: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  reduceMotion: boolean;
};

export const GAME_FEEDBACK_SYNC_EVENT = 'game-feedback-sync';

export function applyDevicePreferencesToGameFeedback(
  p: DevicePreferences,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_SFX, p.sfxEnabled ? 'true' : 'false');
    localStorage.setItem(LS_MUSIC, p.musicEnabled ? 'true' : 'false');
    localStorage.setItem(LS_PARENT_RFM, p.reduceMotion ? 'true' : 'false');
    window.dispatchEvent(new Event(GAME_FEEDBACK_SYNC_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}

export function effectiveSfxEnabled(): boolean {
  try {
    const v = localStorage.getItem(LS_SFX);
    if (v === 'false') return false;
    if (v === 'true') return true;
    return true;
  } catch {
    return true;
  }
}

/**
 * Kurangi animasi jika orang tua mengaktifkan di pengaturan **atau** OS minta reduce motion
 * (kecuali orang tua secara eksplisit menonaktifkan flag dan kita hanya mengikuti OS).
 */
export function effectiveReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const p = localStorage.getItem(LS_PARENT_RFM);
    if (p === 'true') return true;
    if (p === 'false') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch {
    /* fall through */
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function effectiveMusicEnabled(): boolean {
  try {
    const v = localStorage.getItem(LS_MUSIC);
    if (v === 'false') return false;
    if (v === 'true') return true;
    return true;
  } catch {
    return true;
  }
}
