import { test } from '@playwright/test';

test('screenshot login and dashboard', async ({ page }) => {
  // Login page
  await page.goto('http://66.42.114.181/#/auth/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'playwright-screenshots/login-page.png', fullPage: true });

  // Fill credentials
  const emailField = page.locator('input').filter({ hasAttribute: 'type' }).first();
  const allInputs = await page.locator('input').all();
  for (const inp of allInputs) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    console.log(`input type=${type} name=${name}`);
  }

  // Try login
  await page.locator('input[type="email"], input[name="email"]').fill('admin@ictcore.org');
  await page.locator('input[type="password"]').fill('helloAdmin');
  await page.screenshot({ path: 'playwright-screenshots/login-filled.png', fullPage: true });
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'playwright-screenshots/after-login.png', fullPage: true });
  console.log('URL after login:', page.url());

  // Dashboard
  await page.goto('http://66.42.114.181/#/pages/dashboard');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'playwright-screenshots/dashboard-full.png', fullPage: true });
});
