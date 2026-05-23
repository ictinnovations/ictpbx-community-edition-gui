import { test, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE  = 'http://66.42.114.181';
const ADMIN = { email: 'admin@ictcore.org', pass: 'helloAdmin' };
const OUT   = path.join(__dirname, '..', 'e2e', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function login(page: Page) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', ADMIN.email);
  await page.fill('#input-password', ADMIN.pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

test('Debug – capture all requests on billing pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const requests: string[] = [];
  const consoleErrors: string[] = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) requests.push(`${req.method()} ${req.url()}`);
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) requests.push(`  -> ${res.status()} ${res.url()}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  await login(page);
  console.log('Logged in. Current URL:', page.url());
  await page.screenshot({ path: `${OUT}/debug-after-login.png` });

  requests.length = 0;
  await page.goto(`${BASE}/#/pages/plan`);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/debug-plan-page.png` });
  console.log('Plan page URL:', page.url());
  console.log('API calls on /plan navigation:\n', requests.join('\n') || '(none)');
  console.log('Console errors:', consoleErrors.join('\n') || '(none)');
  console.log('Body text:', (await page.locator('body').innerText().catch(() => '')).substring(0, 300));

  requests.length = 0;
  await page.goto(`${BASE}/#/pages/rate`);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/debug-rate-page.png` });
  console.log('Rate page URL:', page.url());
  console.log('API calls on /rate navigation:\n', requests.join('\n'));
  console.log('Body text:', (await page.locator('body').innerText().catch(() => '')).substring(0, 500));
});
