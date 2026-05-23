import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4201';
const ADMIN_EMAIL = 'admin@ictcore.org';
const ADMIN_PASS  = 'helloAdmin';
const USER_EMAIL  = 'user@ictcore.org';
const USER_PASS   = 'helloUser';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', password);
  await page.click('button:has-text("Sign In")');
  // pages.component.ts ngOnInit does a one-time window.location.reload() —
  // wait for the reload to settle then network idle
  await page.waitForURL('**/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}

// Nebular renders ALL menu items in DOM even when collapsed.
// Use the direct-child anchor link title to get just the parent group label.
function menuGroupTitle(page: Page, text: string | RegExp) {
  // .menu-item > a contains the link; .menu-title inside it has the label text
  return page.locator('nb-menu .menu-item > a .menu-title', { hasText: text });
}

// ─── Admin portal tests ───────────────────────────────────────────────────────

test.describe('Admin portal', () => {

  test('Login as admin succeeds', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(page).toHaveURL(/\/pages\//);
  });

  test('Dashboard loads with stat cards', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(page.locator('ngx-status-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Sidebar: PBX menu group is present', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(menuGroupTitle(page, /^PBX$/).first()).toBeVisible({ timeout: 10000 });
  });

  test('Sidebar: Messaging group exists', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(menuGroupTitle(page, /^Messaging$/).first()).toBeVisible({ timeout: 10000 });
  });

  test('Sidebar: Administration group exists', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(menuGroupTitle(page, /^Administration$/).first()).toBeVisible({ timeout: 10000 });
  });

  test('Sidebar: Call Routing group exists', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(menuGroupTitle(page, /^Call Routing$/).first()).toBeVisible({ timeout: 10000 });
  });

  test('PBX submenu: Ring Groups link navigates correctly', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    // Expand PBX group by clicking the link
    await menuGroupTitle(page, /^PBX$/).first().click();
    const rgLink = page.locator('nb-menu a', { hasText: /^Ring Groups$/ });
    await expect(rgLink.first()).toBeVisible({ timeout: 8000 });
    await rgLink.first().click();
    await expect(page).toHaveURL(/ring_groups/, { timeout: 15000 });
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard: multiple stat cards visible for admin', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.waitForTimeout(3000); // allow PBX stat cards to load
    const count = await page.locator('ngx-status-card').count();
    expect(count).toBeGreaterThan(3);
  });

  test('Admin can navigate to Tenants page', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/pages/tenant/tenant`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin can navigate to User Management', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/pages/user/user`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin can navigate to CDR Reports', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/pages/cdr`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin can navigate to Ring Groups page', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/pages/ring_groups/ring_groups`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin can navigate to Call Queues page', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/pages/call_queues/call_queues`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin can navigate to Realtime Monitor', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE_URL}/pages/realtime`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });
});

// ─── User portal tests ────────────────────────────────────────────────────────

test.describe('User portal', () => {

  test('Login as user succeeds', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await expect(page).toHaveURL(/\/pages\//);
  });

  test('Dashboard loads for user', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await expect(page.locator('ngx-status-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('User does NOT see Tenants menu item', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await page.waitForTimeout(1000);
    const tenantsItem = menuGroupTitle(page, /^Tenants$/);
    await expect(tenantsItem).toHaveCount(0);
  });

  test('User does NOT see Administration menu group', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await page.waitForTimeout(1000);
    const adminItem = menuGroupTitle(page, /^Administration$/);
    await expect(adminItem).toHaveCount(0);
  });

  test('User menu always shows Dashboard', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    const dashItem = menuGroupTitle(page, /^Dashboard$/);
    await expect(dashItem.first()).toBeVisible({ timeout: 10000 });
  });

  test('User can navigate to CDR Reports', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await page.goto(`${BASE_URL}/pages/cdr`);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Sidebar has no ICTFax text', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    const sidebarText = await page.locator('nb-menu').innerText();
    expect(sidebarText).not.toMatch(/ICTFax/i);
  });
});

// ─── Branding checks ─────────────────────────────────────────────────────────

test.describe('Branding', () => {

  test('Login page default title is ICTPBX (index.html)', async ({ page }) => {
    // The index.html sets the title before branding API loads
    // intercept any branding calls so we see the default
    await page.route('**/api/branding/**', route => route.abort());
    await page.goto(`${BASE_URL}/auth/login`);
    await expect(page).toHaveTitle(/ICTPBX/i);
  });

  test('Login page logo uses ictpbx (not ictfax)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForSelector('img', { timeout: 10000 });
    const imgSrc = await page.locator('img').first().getAttribute('src');
    expect(imgSrc).not.toMatch(/ictfax/i);
    expect(imgSrc).toMatch(/ictpbx/i);
  });
});
