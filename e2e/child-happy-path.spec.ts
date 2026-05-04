import { expect, test } from '@playwright/test';
import { completeHurufMatchingSession } from './helpers/playthrough';

test.describe('alur anak bahagia', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    });
  });

  test('buat profil, onboarding, satu aktivitas literasi, lihat layar Hebat', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const uniq = Date.now();
    await page.goto('/');

    await page.getByLabel('Nama panggilan').fill(`Play-${uniq}`);
    await page.getByRole('button', { name: /Simpan & mulai/i }).click();

    await expect(page).toHaveURL(/\/onboarding$/);

    await page.getByRole('button', { name: 'Lanjut' }).click();
    await page.getByRole('button', { name: /ketuk/i }).click();
    await page.getByRole('button', { name: 'Mengerti' }).click();
    await page.getByRole('button', { name: 'Mulai belajar' }).click();

    await expect(page).toHaveURL(/\/p\/[^/]+\/?$/);
    const childMatch = page.url().match(/\/p\/([^/?#]+)/);
    const childId = childMatch?.[1];
    if (!childId) throw new Error('Profil tidak punya ID di URL.');
    /** Langsung ke aktivitas seed TK — menghindari status terkunci / race daftar level. */
    await page.goto(`/p/${childId}/play/tk-literasi-1-act1`);

    await expect(
      page
        .locator('.flex.flex-wrap.justify-center.gap-3')
        .getByRole('button')
        .first(),
    ).toBeVisible({
      timeout: 60_000,
    });

    await completeHurufMatchingSession(page);

    await expect(page.getByText(/Bintang/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ke beranda' }),
    ).toBeVisible();
  });
});
