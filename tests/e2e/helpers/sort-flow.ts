import { expect, type Page } from '@playwright/test';

/** Enter actual Sort gameplay explicitly; tutorial/practice are intentionally not RUNs. */
export async function enterSortPlay(page: Page, touch = false): Promise<void> {
  const activate = async (selector: string) => {
    if (touch) await page.locator(selector).tap(); else await page.locator(selector).click();
  };
  await activate('#play-button');
  await expect(page.locator('#begin-button')).toBeVisible();
  await activate('#begin-button');
  await expect(page.locator('.sort-board')).toHaveAttribute('data-phase', 'sorting');
}
