import { expect, test } from '@playwright/test';

test('halaman utama menampilkan judul aplikasi', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Lanjut sebagai tamu/i }).click();
  await expect(page.getByRole('link', { name: 'Main Ceria' })).toBeVisible();
  await expect(
    page.getByText('Mulai petualangan belajar', { exact: false }).first(),
  ).toBeVisible();
});
