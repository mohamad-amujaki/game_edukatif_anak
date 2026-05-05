import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../db';
import { submitActivity } from './submit-activity';

describe('submitActivity', () => {
  beforeEach(() => {
    vi.mocked(prisma.$transaction).mockReset();
  });

  it('menolak jika profil anak tidak ada', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        childProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      } as never),
    );

    await expect(
      submitActivity({
        childId: 'tidak-ada',
        activityId: 'akt-1',
        mistakes: 0,
        durationSec: 30,
        score: 10,
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
