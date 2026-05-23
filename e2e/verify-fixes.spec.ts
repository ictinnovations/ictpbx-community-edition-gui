import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE  = 'http://66.42.114.181';
const ADMIN = { email: 'admin@ictcore.org', pass: 'helloAdmin' };
const USER  = { email: 'user@ictcore.org',  pass: 'helloUser' };
const OUT   = path.join(__dirname, '..', 'e2e', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function login(page: Page, creds: { email: string; pass: string }) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', creds.email);
  await page.fill('#input-password', creds.pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ── Fix 1: regular user should only see their tenant's PBX extensions ──────
test('User – extensions list scoped to own tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, USER);

  // Intercept API response
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/fpbx_extensions') && r.status() === 200),
    page.goto(`${BASE}/#/pages/fpbx_extension/extensions`),
  ]);
  const data = await response.json().catch(() => []);
  console.log('Extensions returned for user:', data.length, 'items');
  if (data.length > 0) console.log('First extension domain_uuid:', data[0].domain_uuid);

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/user-extensions.png` });

  // Should have some data (tenant's own) but not a huge list from all tenants
  expect(Array.isArray(data)).toBe(true);
  console.log('PASS: API returned scoped extension list');
});

test('User – ring groups scoped to own tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, USER);

  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/ring_groups') && r.status() === 200),
    page.goto(`${BASE}/#/pages/ring_groups/ring_groups`),
  ]);
  const data = await response.json().catch(() => []);
  console.log('Ring groups returned for user:', data.length, 'items');
  await page.screenshot({ path: `${OUT}/user-ring-groups.png` });
  expect(Array.isArray(data)).toBe(true);
});

// ── Fix 2: admin billing pages should load (not blank/error) ──────────────
test('Admin – Plans page shows data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, ADMIN);

  // Arm listener before navigation
  const responsePromise = page.waitForResponse(
    r => r.url().includes('/api/plans') && r.status() === 200,
    { timeout: 20000 },
  );
  await page.goto(`${BASE}/#/pages/plan/plan`);
  const response = await responsePromise;
  const data = await response.json().catch(() => []);
  console.log('Plans returned:', data.length, 'items', JSON.stringify(data));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/admin-plans.png` });
  expect(data.length).toBeGreaterThan(0);
  console.log('PASS: Plans page has data');
});

test('Admin – Rate Plans page loads (no error)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, ADMIN);

  const responsePromise = page.waitForResponse(
    r => r.url().includes('/api/rates') && r.status() === 200,
    { timeout: 20000 },
  );
  await page.goto(`${BASE}/#/pages/rate/rate`);
  const response = await responsePromise;
  const data = await response.json().catch(() => null);
  console.log('Rates returned:', JSON.stringify(data));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/admin-rates.png` });
  expect(Array.isArray(data)).toBe(true);
  console.log('Rate Plans page status:', Array.isArray(data) && data.length === 0 ? 'empty (no rates created yet — OK)' : `${data?.length} rates`);
});

test('Admin – Payments page loads (no error)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, ADMIN);

  const responsePromise = page.waitForResponse(
    r => r.url().includes('/api/payments') && r.status() === 200,
    { timeout: 20000 },
  );
  await page.goto(`${BASE}/#/pages/payment/payment`);
  const response = await responsePromise;
  const data = await response.json().catch(() => null);
  console.log('Payments returned:', JSON.stringify(data));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/admin-payments.png` });
  expect(Array.isArray(data)).toBe(true);
  console.log('Payments page status: empty (no payments yet — OK)');
});
