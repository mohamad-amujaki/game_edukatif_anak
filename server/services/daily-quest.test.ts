import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DbClient } from '../db-client';
import { syncAndAwardDailyQuestBonus } from './daily-quest';
import * as dashboard from './dashboard';

vi.mock('./dashboard', () => ({
  getFirstNIncompleteUnlockedActivityIds: vi.fn(),
}));

function dbMock(partial: Record<string, unknown>): DbClient {
  return partial as unknown as DbClient;
}

describe('syncAndAwardDailyQuestBonus', () => {
  beforeEach(() => {
    vi.mocked(dashboard.getFirstNIncompleteUnlockedActivityIds).mockReset();
  });

  it('returns 0 when child has no daily streak row', async () => {
    const d = dbMock({
      dailyStreak: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    });
    await expect(syncAndAwardDailyQuestBonus('c1', 'TK', d)).resolves.toBe(0);
  });

  it('returns 0 while targets for today remain incomplete', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const row = {
      childId: 'c1',
      questTargetDate: today,
      questTargetActivityIds: JSON.stringify(['a1', 'a2']),
      questBonusDate: null,
    };
    const d = dbMock({
      dailyStreak: {
        findUnique: vi.fn().mockResolvedValue(row),
      },
      progress: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ activityId: 'a1', bestStars: 1 }]),
      },
    });
    await expect(syncAndAwardDailyQuestBonus('c1', 'TK', d)).resolves.toBe(0);
  });

  it('awards +15 XP once when all targets have ≥1★ and bonus not yet taken', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const row = {
      childId: 'c1',
      questTargetDate: today,
      questTargetActivityIds: JSON.stringify(['a1']),
      questBonusDate: null,
    };
    const xpCreate = vi.fn().mockResolvedValue({});
    const streakUpdate = vi.fn().mockResolvedValue({});
    const d = dbMock({
      dailyStreak: {
        findUnique: vi.fn().mockResolvedValue(row),
        update: streakUpdate,
      },
      progress: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ activityId: 'a1', bestStars: 2 }]),
      },
      xpLog: { create: xpCreate },
    });

    await expect(syncAndAwardDailyQuestBonus('c1', 'TK', d)).resolves.toBe(15);
    expect(xpCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 15,
          source: 'DAILY_QUEST',
          refId: `quest-${today}`,
        }),
      }),
    );
    expect(streakUpdate).toHaveBeenCalled();
  });
});
