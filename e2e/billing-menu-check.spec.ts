import { test, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE  = 'http://66.42.114.181';
const ADMIN = { email: 'admin@ictcore.org', pass: 'helloAdmin' };
const OUT   = path.join(__dirname, '..', 'e2e', 'screenshots');

fs.mkdirSync(OUT, { recursive: true });

async function loginAdmin(page: Page) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/debug-login-page.png` });
  console.log('login page HTML:', (await page.content()).substring(0, 500));
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', ADMIN.email);
  await page.fill('#input-password', ADMIN.pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

test('Admin sidebar – full menu state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAdmin(page);

  // Expand Billing menu group
  const billing = page.locator('nb-menu').getByText('Billing').first();
  await billing.click().catch(() => {});
  await page.waitForTimeout(800);

  await page.screenshot({ path: `${OUT}/sidebar-billing.png`, fullPage: false });
  console.log('sidebar-billing.png saved');

  // Log menu text to console
  const menuText = await page.locator('nb-menu').innerText().catch(() => 'nb-menu not found');
  console.log('MENU TEXT:\n', menuText);
});

test('Admin – rate plans page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAdmin(page);
  await page.goto(`${BASE}/#/pages/rate`);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/rate-plans.png`, fullPage: false });
  const url = page.url();
  console.log('rate page URL:', url);
  const body = await page.locator('body').innerText().catch(() => '');
  console.log('rate page body snippet:', body.substring(0, 300));
});

test('Admin – plans page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAdmin(page);
  await page.goto(`${BASE}/#/pages/plan`);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/plans.png`, fullPage: false });
  console.log('plans page URL:', page.url());
});

test('Admin – payments page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAdmin(page);
  await page.goto(`${BASE}/#/pages/payment`);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/payments.png`, fullPage: false });
  console.log('payments page URL:', page.url());
});
