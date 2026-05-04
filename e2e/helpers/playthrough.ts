import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Selesaikan sesi aktivitas cocok huruf dengan mencoba kombinasi jawaban sampai banner hasil muncul. */
export async function completeHurufMatchingSession(page: Page) {
  const maxSteps = 150;
  for (let step = 0; step < maxSteps; step++) {
    if (await page.getByText('Hebat!', { exact: false }).isVisible()) break;
    const row = page.locator('.flex.flex-wrap.justify-center.gap-3');
    const n = await row.getByRole('button').count();
    if (n > 0) {
      await row
        .getByRole('button')
        .nth(step % n)
        .click();
    }
    await page.waitForTimeout(120);
  }
  await expect(page.getByText('Hebat!', { exact: false }).first()).toBeVisible({
    timeout: 90_000,
  });
}
