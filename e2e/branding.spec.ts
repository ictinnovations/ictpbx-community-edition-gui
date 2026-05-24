import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'http://66.42.114.181';
const API  = `${BASE}/api`;

async function getToken(request: any, email: string, pass: string): Promise<string> {
  const r = await request.post(`${API}/authenticate`, { data: { username: email, password: pass } });
  const d = await r.json();
  return d.token || d.data?.token || d.access_token || '';
}

async function login(page: any, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function nav(page: any, hash: string) {
  await page.evaluate((h: string) => { window.location.hash = h; }, hash);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

let adminToken = '';

async function selectTenant85(page: any) {
  // Wait for tenant options to load (async API call), then select by label text
  // Options inside <select> are not "visible" in Playwright sense — use toBeAttached
  const sel = page.locator('select').first();
  await expect(sel.locator('option').filter({ hasText: /Test Company/ }).first()).toBeAttached({ timeout: 10000 });
  await sel.selectOption({ label: 'Test Company' });
  await page.waitForTimeout(1500);
}

test.describe('Branding', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin@ictcore.org', 'helloAdmin');
  });

  test('admin branding page loads', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').first()).toHaveCount(0);
  });

  test('tenant dropdown is populated', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);
    // Branding uses native <select> with nbSelect directive
    const sel = page.locator('select').first();
    await expect(sel).toBeVisible({ timeout: 10000 });
    const optionCount = await sel.locator('option').count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test('admin selects tenant 143 and form fields appear', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);
    await selectTenant85(page);

    // Domain and title inputs are always visible (id="domain" and id="title")
    await expect(page.locator('input#domain')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input#title')).toBeVisible({ timeout: 8000 });
  });

  test('admin saves branding title for tenant 143', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);
    await selectTenant85(page);

    // All three fields are required — fill unconditionally to ensure Angular model is populated
    const domainInput = page.locator('input#domain');
    await domainInput.click();
    await domainInput.fill('test-company.local');

    const titleInput = page.locator('input#title');
    await titleInput.click();
    await titleInput.fill('e2e_brand_test');

    const footerInput = page.locator('textarea#footer');
    await footerInput.click();
    await footerInput.fill('e2e Test Footer');

    await page.waitForTimeout(500);

    const saveBtn = page.locator('button:has-text("Submit")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.alert-danger').first()).toHaveCount(0);
  });

  test('saved title persists on page reload', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);
    await selectTenant85(page);

    const val = await page.locator('input#title').inputValue();
    expect(val).toContain('e2e_brand_test');
  });

  test('theme_lock dropdown is present', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);

    // theme_lock is a native select with id="theme_lock" — always visible
    await expect(page.locator('select#theme_lock')).toBeVisible({ timeout: 8000 });
  });

  test('tenant admin cannot access branding page', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/branding');
    await page.waitForTimeout(1500);
    // Either redirected away or Branding not in sidebar
    const brandingMenuItem = page.locator('nb-menu a:has-text("Branding"), a.menu-item:has-text("Branding")');
    await expect(brandingMenuItem).toHaveCount(0);
  });

  test('public branding API returns tenant 143 data', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.get(`${API}/branding/143`, { headers });
    expect(r.ok()).toBeTruthy();
    const d = await r.json();
    const data = d.data ?? d;
    expect(data).toHaveProperty('title');
  });
});
