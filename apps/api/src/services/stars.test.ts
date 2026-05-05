import { describe, expect, it } from 'vitest';
import { computeXp, starsFromMistakes } from './stars';

describe('starsFromMistakes', () => {
  it('maps mistakes to star rating', () => {
    expect(starsFromMistakes(0)).toBe(3);
    expect(starsFromMistakes(2)).toBe(2);
    expect(starsFromMistakes(3)).toBe(1);
  });
});

describe('computeXp', () => {
  it('uses first-complete base, star bonus, streak', () => {
    expect(
      computeXp({ stars: 3, isFirstComplete: true, streakBonus: true }),
    ).toBe(20 + 15 + 10);
    expect(
      computeXp({ stars: 3, isFirstComplete: false, streakBonus: false }),
    ).toBe(5 + 15);
  });
});
