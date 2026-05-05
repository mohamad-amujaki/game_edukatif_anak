import { describe, expect, it, vi } from 'vitest';
import type { DbClient } from '../db-client';
import { refreshMasteryForChild } from './mastery';

function dbMock(partial: Record<string, unknown>): DbClient {
  return partial as unknown as DbClient;
}

function upsertLevelId(where: unknown): string | undefined {
  const w = where as {
    childId_levelId?: { levelId?: string };
  };
  return w.childId_levelId?.levelId;
}

describe('refreshMasteryForChild', () => {
  it('unlock literasi level 2 when literasi level 1 aktivitas mencapai ≥2★', async () => {
    const captured: Array<{ args: Record<string, unknown> }> = [];

    const levels = [
      {
        id: 'tk-lit-1',
        track: 'literasi' as const,
        order: 1,
        activities: [{ id: 'lit-a1' }],
      },
      {
        id: 'tk-lit-2',
        track: 'literasi' as const,
        order: 2,
        activities: [{ id: 'lit-a2' }],
      },
      {
        id: 'tk-math-1',
        track: 'math' as const,
        order: 1,
        activities: [{ id: 'math-a1' }],
      },
      {
        id: 'tk-math-2',
        track: 'math' as const,
        order: 2,
        activities: [{ id: 'math-a2' }],
      },
    ];

    const d = dbMock({
      levelDefinition: {
        findMany: vi.fn().mockResolvedValue(levels),
      },
      progress: {
        findMany: vi.fn().mockResolvedValue([
          { activityId: 'lit-a1', bestStars: 2 },
          { activityId: 'math-a1', bestStars: 0 },
        ]),
      },
      levelMastery: {
        findMany: vi.fn().mockResolvedValue([
          {
            levelId: 'tk-lit-1',
            isUnlocked: true,
            unlockedAt: new Date(),
            isMastered: false,
          },
          {
            levelId: 'tk-lit-2',
            isUnlocked: false,
            unlockedAt: null,
            isMastered: false,
          },
          {
            levelId: 'tk-math-1',
            isUnlocked: true,
            unlockedAt: new Date(),
            isMastered: false,
          },
          {
            levelId: 'tk-math-2',
            isUnlocked: false,
            unlockedAt: null,
            isMastered: false,
          },
        ]),
        upsert: vi
          .fn()
          .mockImplementation(async (args: Record<string, unknown>) => {
            captured.push({ args });
          }),
      },
    });

    await refreshMasteryForChild('child-1', 'TK', d);

    const lit2 = captured.find(
      (c) => upsertLevelId(c.args.where) === 'tk-lit-2',
    );
    expect((lit2?.args.create as { isUnlocked?: boolean })?.isUnlocked).toBe(
      true,
    );

    const math2 = captured.find(
      (c) => upsertLevelId(c.args.where) === 'tk-math-2',
    );
    expect((math2?.args.create as { isUnlocked?: boolean })?.isUnlocked).toBe(
      false,
    );
  });
});
