import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LS_PARENT_RFM,
  LS_SFX,
  applyDevicePreferencesToGameFeedback,
  effectiveReducedMotion,
  effectiveSfxEnabled,
} from './game-feedback-sync';

function mockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    store,
  };
}

describe('game-feedback-sync', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  it('writes keys from applyDevicePreferencesToGameFeedback', () => {
    const ls = mockStorage();
    vi.stubGlobal('localStorage', ls);

    applyDevicePreferencesToGameFeedback({
      dailyTimeCapMinutes: 30,
      breakReminderMinutes: 15,
      sfxEnabled: false,
      musicEnabled: true,
      reduceMotion: true,
    });

    expect(ls.getItem(LS_SFX)).toBe('false');
    expect(ls.getItem(LS_PARENT_RFM)).toBe('true');
    expect(effectiveSfxEnabled()).toBe(false);
    expect(effectiveReducedMotion()).toBe(true);
  });
});
