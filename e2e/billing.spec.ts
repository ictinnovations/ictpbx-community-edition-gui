/**
 * Billing E2E test suite — runs against EE prod (http://66.42.114.181)
 *
 * Covers:
 * - Balance chip visible in header for all roles
 * - Admin tenant filter dropdown on list pages
 * - Tenant/user sees NO tenant dropdown
 * - Payment creation updates tenant.credit
 * - Billing quota + usage pages load
 * - Dashboard balance card for tenant/user
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE     = 'http://66.42.114.181';
const API      = `${BASE}/api`;
const ADMIN    = { email: 'admin@ictcore.org', pass: 'helloAdmin' };
const USER     = { email: 'user@ictcore.org',  pass: 'helloUser' };

// Tenant-admin test account — created in beforeAll if missing
const TENANT_EMAIL = 'billing-tenant@ictpbx.test';
const TENANT_PASS  = 'BillingTenant@1';

test.describe.configure({ mode: 'serial' });

// ─── helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function adminToken(request: APIRequestContext): Promise<string> {
  const r = await request.post(`${API}/authenticate`, {
    data: { username: ADMIN.email, password: ADMIN.pass },
  });
  const d = await r.json();
  return d.token || d.data?.token || d.access_token || '';
}

// ─── Setup: ensure a tenant-admin user exists for tenant 86 ──────────────────

test.beforeAll(async ({ request }) => {
  const token = await adminToken(request);
  if (!token) return;
  const headers = { Authorization: `Bearer ${token}` };

  // Check if our test tenant user already exists
  const usersResp = await request.get(`${API}/users`, { headers });
  if (!usersResp.ok()) return;
  const users: any[] = await usersResp.json();
  const existing = users.find((u: any) => u.email === TENANT_EMAIL);
  if (existing) return;

  // Create tenant-admin user under tenant 86
  await request.post(`${API}/users`, {
    headers,
    data: {
      username: TENANT_EMAIL,
      email: TENANT_EMAIL,
      first_name: 'Billing',
      last_name: 'Tenant',
      phone: '5550000001',
      password: TENANT_PASS,
      active: 1,
      tenant_id: 86,
      daily_limit: 50,
      monthly_limit: 200,
      user_permission: 'fpbx_extension,ring_groups,voicemails,billing,billing_usage,billing_quota',
    },
  });

  // Assign tenant role
  const rolesResp = await request.get(`${API}/roles`, { headers });
  if (!rolesResp.ok()) return;
  const roles: any[] = await rolesResp.json();
  const tenantRole = roles.find((r: any) => r.name?.toLowerCase() === 'tenant');
  if (!tenantRole) return;

  const usersResp2 = await request.get(`${API}/users`, { headers });
  if (!usersResp2.ok()) return;
  const users2: any[] = await usersResp2.json();
  const newUser = users2.find((u: any) => u.email === TENANT_EMAIL);
  if (newUser && tenantRole) {
    await request.put(`${API}/users/${newUser.usr_id ?? newUser.user_id}/roles/${tenantRole.role_id}`, {
      headers, data: String(newUser.usr_id ?? newUser.user_id),
    });
  }
});

// ─── Admin role tests ─────────────────────────────────────────────────────────

test.describe('Admin role', () => {

  test('Header shows Balance chip', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    const chip = page.locator('span.header-balance, span:has-text("Balance:")').first();
    await expect(chip).toBeVisible({ timeout: 10000 });
  });

  test('Billing Quota page loads with tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    await page.goto(`${BASE}/#/pages/billing-quota`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toBeVisible({ timeout: 8000 });
  });

  test('Billing Usage page loads with tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    await page.goto(`${BASE}/#/pages/billing-usage`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toBeVisible({ timeout: 8000 });
  });

  test('Extensions list has admin tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    await page.goto(`${BASE}/#/pages/fpbx_extension/extensions`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toBeVisible({ timeout: 8000 });
  });

  test('Payments list has admin tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    await page.goto(`${BASE}/#/pages/payment/payment`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toBeVisible({ timeout: 8000 });
  });

  test('Add payment for tenant 86 increases tenant.credit', async ({ request }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };

    // Get baseline credit
    const beforeResp = await request.get(`${API}/tenants/86`, { headers });
    expect(beforeResp.ok()).toBeTruthy();
    const creditBefore = parseFloat((await beforeResp.json()).credit ?? '0');

    // Create payment
    const payResp = await request.post(`${API}/payments`, {
      headers,
      data: {
        tenant_id: 86,
        usr_id: 1,
        paid_amount: 25.00,
        paid_date: new Date().toISOString().split('T')[0],
      },
    });
    expect(payResp.ok()).toBeTruthy();

    // Verify credit increased
    const afterResp = await request.get(`${API}/tenants/86`, { headers });
    expect(afterResp.ok()).toBeTruthy();
    const creditAfter = parseFloat((await afterResp.json()).credit ?? '0');
    expect(creditAfter).toBeCloseTo(creditBefore + 25, 1);
  });

  test('Rate page loads', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    await page.goto(`${BASE}/#/pages/rate/rate`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Plan page loads', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, ADMIN.email, ADMIN.pass);
    await page.goto(`${BASE}/#/pages/plan/plan`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

});

// ─── Tenant-admin role tests ──────────────────────────────────────────────────

test.describe('Tenant-admin role', () => {

  test('Header shows Balance chip', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, TENANT_EMAIL, TENANT_PASS);
    const chip = page.locator('span.header-balance, span:has-text("Balance:")').first();
    await expect(chip).toBeVisible({ timeout: 10000 });
  });

  test('Billing Quota page loads with NO tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await page.goto(`${BASE}/#/pages/billing-quota`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toHaveCount(0);
  });

  test('Extensions list has NO tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await page.goto(`${BASE}/#/pages/fpbx_extension/extensions`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toHaveCount(0);
  });

  test('Dashboard shows Account Balance card', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await page.goto(`${BASE}/#/pages/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('ngx-status-card').filter({ hasText: /Account Balance/ })).toBeVisible({ timeout: 10000 });
  });

});

// ─── End-user role tests ──────────────────────────────────────────────────────

test.describe('End-user role', () => {

  test('Header shows Balance chip', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, USER.email, USER.pass);
    const chip = page.locator('span.header-balance, span:has-text("Balance:")').first();
    await expect(chip).toBeVisible({ timeout: 10000 });
  });

  test('Billing Usage page loads with NO tenant dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, USER.email, USER.pass);
    await page.goto(`${BASE}/#/pages/billing-usage`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-select').filter({ hasText: /All Tenants/ })).toHaveCount(0);
  });

});
