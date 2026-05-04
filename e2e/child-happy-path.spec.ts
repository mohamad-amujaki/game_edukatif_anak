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

    await page.getByRole('link', { name: 'Literasi' }).click();

    await page
      .getByRole('link', { name: /^Buka$/ })
      .first()
      .click();

    await page.locator(`a[href*="/play/"]`).first().click();

    await expect(page.getByText(/^Soal /)).toBeVisible({ timeout: 60_000 });

    await completeHurufMatchingSession(page);

    await expect(page.getByText(/Bintang/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ke beranda' }),
    ).toBeVisible();
  });
});
