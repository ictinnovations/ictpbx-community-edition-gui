import { test } from '@playwright/test';
async function login(page: any) {
  await page.goto('http://66.42.114.181/#/auth/login');
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', 'admin@ictcore.org');
  await page.fill('input[type="password"]', 'helloAdmin');
  await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
  await page.waitForURL(/\/(pages|dashboard)/, { timeout: 15000 });
}
test('DID Management page', async ({ page }) => {
  await login(page);
  await page.goto('http://66.42.114.181/#/pages/dids/dids');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'playwright-screenshots/did-management.png', fullPage: true });
  console.log('URL:', page.url());
});
