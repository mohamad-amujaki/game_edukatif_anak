import { expect, test } from '@playwright/test';

test.describe('PIN orang tua', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
    });
  });

  test('setup PIN → masuk dengan PIN → ubah PIN → verifikasi PIN baru', async ({
    page,
  }) => {
    await page.goto('/parent');

    await page.getByRole('button', { name: /Setup PIN pertama kali/i }).click();

    await page.locator('#parent-pin-new').fill('4242');
    // nth(0) adalah PIN lagi — pertanyaan pemulihan ialah textbox berikutnya.
    await page.getByRole('textbox').nth(1).fill('Warna kesukaan?');
    await page.getByPlaceholder('Jawaban singkat').fill('Biru');

    await page.getByRole('button', { name: 'Simpan', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Laporan' })).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/');

    await page.goto('/parent');

    await page.locator('input[inputmode="numeric"]').first().fill('4242');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page.getByRole('heading', { name: 'Laporan' })).toBeVisible();

    await page.getByRole('button', { name: 'Ubah PIN' }).click();

    await page.locator('#parent-pin-current').fill('4242');
    await page.locator('#parent-pin-new').fill('9191');
    await page.getByRole('textbox').nth(2).fill('Warna kesukaan?');
    await page.getByPlaceholder('Jawaban singkat').fill('Hijau');

    await page.getByRole('button', { name: 'Simpan', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Laporan' })).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/');

    await page.goto('/parent');

    await page.locator('input[inputmode="numeric"]').first().fill('9191');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page.getByRole('heading', { name: 'Laporan' })).toBeVisible({
      timeout: 20_000,
    });
  });
});
