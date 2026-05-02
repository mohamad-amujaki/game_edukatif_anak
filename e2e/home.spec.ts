import { expect, test } from '@playwright/test';

test('halaman utama menampilkan judul aplikasi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Bimo Belajar' })).toBeVisible();
  await expect(page.getByText('Halo!', { exact: false }).first()).toBeVisible();
});
