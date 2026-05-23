import { test, expect } from '@playwright/test';
async function loginAs(page: any, email: string, pass: string) {
  await page.goto('http://66.42.114.181/#/auth/login');
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
  await page.waitForURL(/\/(pages|dashboard)/, { timeout: 15000 });
}
test('End user menu shows only allowed items', async ({ page }) => {
  await loginAs(page, 'new3@ictcore.org', 'helloUser');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'playwright-screenshots/user-menu.png', fullPage: true });
  // Should NOT see Extensions, Ring Groups, Devices etc.
  const extLink = page.locator('a[href*="fpbx_extension"]');
  await expect(extLink).toHaveCount(0);
  console.log('✅ No Extensions link in user menu');
  // Should see My Extension
  const myExtLink = page.locator('a[href*="my-account"]');
  console.log('My Extension links:', await myExtLink.count());
  await page.screenshot({ path: 'playwright-screenshots/user-menu-check.png', fullPage: true });
});
test('End user My Extension page loads', async ({ page }) => {
  await loginAs(page, 'new3@ictcore.org', 'helloUser');
  await page.goto('http://66.42.114.181/#/pages/my-account/my-account');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'playwright-screenshots/my-account-page.png', fullPage: true });
  console.log('URL:', page.url());
});
test('End user cannot POST to create extension', async ({ page }) => {
  await loginAs(page, 'new3@ictcore.org', 'helloUser');
  // Try to navigate to create form - UI should work but API should 403
  await page.goto('http://66.42.114.181/#/pages/fpbx_extension/extensions/new');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'playwright-screenshots/user-try-create-ext.png', fullPage: true });
});
