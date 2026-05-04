import { expect, test } from '@playwright/test';

const adminEmail =
  process.env.E2E_ADMIN_EMAIL ?? process.env.CI_ADMIN_EMAIL ?? '';
const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.CI_ADMIN_PASSWORD ?? '';

test.describe('admin analytics', () => {
  test.skip(
    !adminEmail || !adminPassword,
    'Set E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD (atau CI_* di CI)',
  );

  test('login dan buka Analytics', async ({ page }) => {
    await page.goto('/admin/login');

    await page.locator('#email').fill(adminEmail);
    await page.locator('#password').fill(adminPassword);

    await page.getByRole('button', { name: /Masuk Panel/i }).click();

    await expect(page).toHaveURL(/\/admin\/?$/i, { timeout: 45_000 });

    await page
      .getByRole('link', { name: /^Analytics$/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/admin\/analytics/i);

    await expect(
      page.getByRole('heading', { level: 1, name: /Analytics/i }),
    ).toBeVisible({
      timeout: 45_000,
    });
  });
});
