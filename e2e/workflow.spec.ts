/**
 * Full multi-tenant workflow E2E test
 * 1. Admin creates tenant + allocates resource quotas
 * 2. Tenant creates user + assigns permissions
 * 3. User logs in, checks menus and Billing > My Usage
 *
 * The app uses HashLocationStrategy: URLs are /#/pages/...
 */

import { test, expect, Page } from '@playwright/test';

const BASE     = process.env.PW_BASE_URL || 'http://localhost:4201';
const API_BASE = process.env.E2E_API_BASE || `${BASE}/api`;

const ADMIN_EMAIL  = 'admin@ictcore.org';
const ADMIN_PASS   = 'helloAdmin';
const TENANT_EMAIL = 'e2etenant@ictpbx.test';
const TENANT_PASS  = 'Tenant@12345!';
const USER_EMAIL   = 'e2euser@ictpbx.test';
const USER_PASS    = 'UserTest@123!';

// Force serial execution; cleanup runs once via globalSetup in playwright.config.ts.
test.describe.configure({ mode: 'serial' });

// ─── helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  // Wait for pages route (auth guard passes) OR stay on auth (login failed/redirect)
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  // PagesComponent.ngOnInit does a one-time reload; wait for the sidebar to appear
  // (sidebar visible = Angular bootstrapped + header set localStorage + menu rendered)
  await page.waitForSelector('nb-sidebar, nb-menu', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// Navigate via Angular hash router (avoids re-bootstrap from page.goto)
async function navigate(page: Page, hashPath: string) {
  await page.evaluate((path) => {
    window.location.hash = path;
  }, hashPath);
  await page.waitForTimeout(1500);
}

// ─── Step 1: Admin creates tenant (org-only) + tenant-admin user ──────────────
// Two-step flow per provisioning model: tenant is org-only (no auth),
// then a `usr` row with role=3 is created under that tenant for login.

test.describe('Step 1 – Admin creates tenant org + tenant-admin user', () => {

  // Run before every attempt (including retries) so tenant/user creation is idempotent.
  test.beforeAll(async ({ request }) => {
    const API = API_BASE;
    try {
      const authResp = await request.post(`${API}/authenticate`, {
        data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
      });
      if (!authResp.ok()) return;
      const authData = await authResp.json();
      const token = authData.token || authData.data?.token || authData.access_token;
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      // Delete e2euser then e2etenant user (order matters — e2euser may be under the tenant)
      const usersResp = await request.get(`${API}/users`, { headers });
      if (usersResp.ok()) {
        const users: any[] = await usersResp.json();
        for (const u of users) {
          if (u.email === USER_EMAIL || u.username === 'e2euser' ||
              u.email === TENANT_EMAIL || u.username === TENANT_EMAIL) {
            await request.delete(`${API}/users/${u.user_id}`, { headers });
          }
        }
      }

      // Delete tenant org
      const tenantsResp = await request.get(`${API}/tenants`, { headers });
      if (tenantsResp.ok()) {
        const tenants: any[] = await tenantsResp.json();
        for (const t of tenants) {
          if (t.email === TENANT_EMAIL) {
            await request.delete(`${API}/tenants/${t.tenant_id}`, { headers });
          }
        }
      }
    } catch (_) { /* ignore — test will surface the real failure */ }
  });

  test('Admin: tenant list page loads', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/tenant/tenant');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin: tenant create form has NO Password field', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/tenant/tenant/new');
    await expect(page.locator('#company')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#passwd')).toHaveCount(0);
  });

  test('Admin: tenant create form has Resource Quotas card', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/tenant/tenant/new');
    await expect(page.locator('nb-card-header', { hasText: /Resource Quotas/i })).toBeVisible({ timeout: 10000 });
  });

  test('Admin: create new tenant org with quotas', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/tenant/tenant/new');

    await expect(page.locator('#company')).toBeVisible({ timeout: 10000 });

    // name
    await page.locator('#first_name').fill('E2E');
    await page.locator('#last_name').fill('Tenant');

    // company details
    await page.locator('#company').fill('E2E Test Corp');
    await page.locator('#phone').fill('1234567890');
    await page.locator('#email').fill(TENANT_EMAIL);

    // active = yes
    await page.locator('input[type="radio"][value="1"]').first().check();

    // fax limits
    await page.locator('#daily_limit').fill('100');
    await page.locator('#monthly_limit').fill('500');

    // quotas: Ring Groups → 5 (first number input in the Resource Quotas card)
    const quotaCard = page.locator('nb-card', { has: page.locator('nb-card-header', { hasText: /Resource Quotas/i }) });
    await quotaCard.locator('input[type="number"]').first().fill('5');

    // submit
    await page.click('button:has-text("Submit")');

    // wait for navigation away from the create form to the tenant list
    await page.waitForURL('**/#/pages/tenant/tenant', { timeout: 15000 });
  });

  test('Admin: create tenant-admin user under the new tenant', async ({ page, request }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/user/user/new');

    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });

    // identity + password — this is the tenant's first login
    await page.locator('#username').fill(TENANT_EMAIL);
    await page.locator('#first_name').fill('E2E');
    await page.locator('#last_name').fill('Tenant');
    await page.locator('#phone').fill('1234567890');
    await page.locator('#email').fill(TENANT_EMAIL);
    await page.locator('#password').fill(TENANT_PASS);
    await page.locator('#confirmPassword').fill(TENANT_PASS);

    // active = yes
    await page.locator('input[type="radio"][name="active"][value="1"]').check();

    // pick the tenant we just created (last option in the tenant select)
    const tenantSelect = page.locator('select#tenant_id, select[name="tenant_id"]').first();
    if (await tenantSelect.count() > 0) {
      const lastValue = await tenantSelect.evaluate((sel: HTMLSelectElement) => {
        return sel.options[sel.options.length - 1]?.value || '';
      });
      if (lastValue) await tenantSelect.selectOption(lastValue);
    }

    // user fax limits within tenant cap (100 / 500)
    const dailyLimitInput = page.locator('#daily_limit');
    if (await dailyLimitInput.count() > 0) await dailyLimitInput.fill('50');
    const monthlyLimitInput = page.locator('#monthly_limit');
    if (await monthlyLimitInput.count() > 0) await monthlyLimitInput.fill('250');

    // grant PBX permissions so menu visibility tests in Step 2 can pass
    const allCheckboxes = page.locator('input[type="checkbox"]');
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = allCheckboxes.nth(i);
      const label = await cb.evaluate(el => {
        const parent = el.closest('div') || el.parentElement;
        return parent ? parent.textContent?.trim() : '';
      });
      if (label && (
            /ring[_ ]?groups/i.test(label) ||
            /voicemail/i.test(label) ||
            /pbx/i.test(label) ||
            /user[_ ]?admin/i.test(label)
          )) {
        if (!(await cb.isChecked())) await cb.dispatchEvent('click');
      }
    }

    // submit
    await page.locator('button.btn-success, button:has-text("Submit")').first().click();
    await page.waitForURL('**/#/pages/user/user', { timeout: 15000 });

    // Assign tenant role via API — checkbox (change) binding unreliable in headless Playwright.
    // Role assignment is separate from user creation: PUT /users/{id}/roles/{role_id}.
    const API = API_BASE;
    const authResp = await request.post(`${API}/authenticate`, {
      data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    if (authResp.ok()) {
      const authData = await authResp.json();
      const token = authData.token || authData.data?.token || authData.access_token;
      if (token) {
        const headers = { Authorization: `Bearer ${token}` };
        const usersResp = await request.get(`${API}/users`, { headers });
        if (usersResp.ok()) {
          const users: any[] = await usersResp.json();
          const newUser = users.find((u: any) => u.email === TENANT_EMAIL);
          if (newUser) {
            const rolesResp = await request.get(`${API}/roles`, { headers });
            if (rolesResp.ok()) {
              const roles: any[] = await rolesResp.json();
              const tenantRole = roles.find((r: any) => (r.name || '').toLowerCase() === 'tenant');
              if (tenantRole) {
                await request.put(`${API}/users/${newUser.user_id}/roles/${tenantRole.role_id}`, {
                  headers, data: String(newUser.user_id),
                });
              }
            }
          }
        }
      }
    }
  });

});

// ─── Step 2: Tenant creates user ─────────────────────────────────────────────

test.describe('Step 2 – Tenant creates user', () => {

  test('Tenant: login succeeds', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    expect(page.url()).toMatch(/pages/);
  });

  test('Tenant: has NO Call Routing in sidebar', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    const callRouting = page.locator('nb-menu .menu-title', { hasText: /^Call Routing$/i });
    await expect(callRouting).toHaveCount(0, { timeout: 5000 });
  });

  test('Tenant: has PBX in sidebar', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await expect(page.locator('nb-menu .menu-title', { hasText: /^PBX$/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Tenant: has Billing in sidebar', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await expect(page.locator('nb-menu .menu-title', { hasText: /Billing/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Tenant: user list page loads', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/user/user');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Tenant: create new user with permissions', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    // Use goto so Angular router receives a proper full navigation event
    await page.goto(`${BASE}/#/pages/user/user/new`);
    await page.waitForLoadState('load', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // wait for form
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });

    await page.locator('#username').fill('e2euser');
    await page.locator('#first_name').fill('E2E');
    await page.locator('#last_name').fill('User');
    await page.locator('#phone').fill('9876543210');
    await page.locator('#password').fill(USER_PASS);
    await page.locator('#confirmPassword').fill(USER_PASS);
    await page.locator('#email').fill(USER_EMAIL);

    // active = yes (default is no, which would block login)
    await page.locator('input[type="radio"][name="active"][value="1"]').check();

    // user fax limits must not exceed tenant remaining capacity (which may be 0)
    const dailyLimitInput = page.locator('#daily_limit');
    if (await dailyLimitInput.count() > 0) await dailyLimitInput.fill('0');
    const monthlyLimitInput = page.locator('#monthly_limit');
    if (await monthlyLimitInput.count() > 0) await monthlyLimitInput.fill('0');

    // check ring_groups and voicemails permission checkboxes
    const allCheckboxes = page.locator('input[type="checkbox"]');
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = allCheckboxes.nth(i);
      const label = await cb.evaluate(el => {
        const parent = el.closest('div') || el.parentElement;
        return parent ? parent.textContent?.trim() : '';
      });
      if (label && (label.includes('ring_groups') || label.includes('Ring Groups')
          || label.includes('voicemail') || label.includes('Voicemail'))) {
        if (!(await cb.isChecked())) await cb.dispatchEvent('click');
      }
    }

    // submit and wait for navigation back to user list (proves save succeeded)
    await page.locator('button.btn-success', { hasText: /submit/i }).first().click();
    await page.waitForURL('**/#/pages/user/user', { timeout: 15000 });
  });

});

// ─── Step 3: User checks menus ────────────────────────────────────────────────

test.describe('Step 3 – User checks menus', () => {

  test('User: login succeeds', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    expect(page.url()).toMatch(/pages/);
  });

  test('User: Dashboard visible', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await expect(page.locator('nb-menu .menu-title', { hasText: /^Dashboard$/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('User: NO Call Routing in sidebar', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await expect(page.locator('nb-menu .menu-title', { hasText: /^Call Routing$/i })).toHaveCount(0, { timeout: 5000 });
  });

  test('User: NO Administration in sidebar', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await expect(page.locator('nb-menu .menu-title', { hasText: /^Administration$/i })).toHaveCount(0, { timeout: 5000 });
  });

  test('User: Billing section always visible', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await expect(page.locator('nb-menu .menu-title', { hasText: /^Billing$/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('User: Billing > My Usage navigates', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await navigate(page, '/pages/billing-usage');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('User: Ring Groups page loads', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await navigate(page, '/pages/ring_groups/ring_groups');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('User: Voicemail page loads', async ({ page }) => {
    await login(page, USER_EMAIL, USER_PASS);
    await navigate(page, '/pages/voicemails/voicemails');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

});
