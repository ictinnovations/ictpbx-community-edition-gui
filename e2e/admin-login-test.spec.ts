import { test, expect } from '@playwright/test';
const BASE = 'http://66.42.114.181';
test('admin login', async ({ page }) => {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  await page.fill('#input-email', 'admin@ictcore.org');
  await page.fill('#input-password', 'helloAdmin');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  console.log('URL:', page.url());
  await page.waitForURL('**/#/pages/**', { timeout: 30000 });
  expect(page.url()).toContain('/pages/');
});
