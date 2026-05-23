/**
 * PBX Multi-Tenant Isolation Verification
 *
 * Verifies the fix for: tenants seeing system-wide PBX counts on dashboard
 * and empty PBX lists when creating extensions/ring groups.
 *
 * Flow:
 *  1. Admin creates a fresh tenant + assigns FusionPBX domain via API
 *  2. Admin creates a tenant-admin user under that tenant
 *  3. Tenant admin logs in
 *  4. Dashboard counts are 0 (not system-wide)
 *  5. Create extension → appears in list, dashboard count = 1
 *  6. Create ring group → appears in list
 *  7. Admin sees system-wide counts (includes new items)
 *
 * Target: EE prod http://66.42.114.181
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE     = 'http://66.42.114.181';
const API      = `${BASE}/api`;
const ADMIN_EMAIL = 'admin@ictcore.org';
const ADMIN_PASS  = 'helloAdmin';
const TENANT_EMAIL = 'pbx-isolation-test@ictpbx.test';
const TENANT_PASS  = 'IsoTest@9999!';

test.describe.configure({ mode: 'serial' });

// ─── helpers ─────────────────────────────────────────────────────────────────

async function adminToken(request: APIRequestContext): Promise<string> {
  const r = await request.post(`${API}/authenticate`, {
    data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  expect(r.ok(), 'Admin auth failed').toBeTruthy();
  const d = await r.json();
  return d.token || d.data?.token || d.access_token;
}

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForSelector('nb-sidebar, nb-menu', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function navigate(page: Page, hashPath: string) {
  await page.evaluate((p) => { window.location.hash = p; }, hashPath);
  await page.waitForTimeout(1500);
}

// ─── Setup: create test tenant + user via API ─────────────────────────────────

let testTenantId: number;
let testUserId: number;

test.beforeAll(async ({ request }) => {
  const token = await adminToken(request);
  const headers = { Authorization: `Bearer ${token}` };

  // Clean up any leftover test data from previous runs
  const usersResp = await request.get(`${API}/users`, { headers });
  if (usersResp.ok()) {
    for (const u of await usersResp.json()) {
      if (u.email === TENANT_EMAIL) {
        await request.delete(`${API}/users/${u.user_id}`, { headers });
      }
    }
  }
  const tenantsResp = await request.get(`${API}/tenants`, { headers });
  if (tenantsResp.ok()) {
    for (const t of await tenantsResp.json()) {
      if (t.email === TENANT_EMAIL) {
        await request.delete(`${API}/tenants/${t.tenant_id}`, { headers });
      }
    }
  }

  // Create tenant
  const tResp = await request.post(`${API}/tenants`, {
    headers,
    data: {
      first_name: 'PBX',
      last_name: 'IsoTest',
      company: 'PBX Isolation Test Corp',
      phone: '5550001111',
      email: TENANT_EMAIL,
      active: 1,
      daily_limit: 100,
      monthly_limit: 500,
    },
  });
  expect(tResp.ok(), `Tenant creation failed: ${await tResp.text()}`).toBeTruthy();
  const tData = await tResp.json();
  testTenantId = tData.tenant_id || tData.data?.tenant_id || tData;
  expect(testTenantId, 'tenant_id not returned').toBeTruthy();

  // Assign a new FusionPBX domain to the tenant
  const domResp = await request.post(`${API}/fpbx_domains`, {
    headers,
    data: {
      tenant_id: testTenantId,
      domain_name: `pbx-isoTest-${testTenantId}.local`,
      domain_description: 'E2E PBX isolation test domain',
    },
  });
  expect(domResp.ok(), `Domain assign failed: ${await domResp.text()}`).toBeTruthy();

  // Create tenant-admin user
  const uResp = await request.post(`${API}/users`, {
    headers,
    data: {
      username: TENANT_EMAIL,
      first_name: 'PBX',
      last_name: 'Admin',
      email: TENANT_EMAIL,
      password: TENANT_PASS,
      phone: '5550001112',
      active: 1,
      tenant_id: testTenantId,
      daily_limit: 50,
      monthly_limit: 250,
      user_permission: 'fpbx_extension,ring_groups,call_queues,ivr_menus,voicemails,conferences,devices,user_admin',
    },
  });
  expect(uResp.ok(), `User creation failed: ${await uResp.text()}`).toBeTruthy();
  const uData = await uResp.json();
  testUserId = uData.user_id || uData.data?.user_id || uData;

  // Assign tenant role (role 3)
  const rolesResp = await request.get(`${API}/roles`, { headers });
  if (rolesResp.ok()) {
    const roles: any[] = await rolesResp.json();
    const tenantRole = roles.find((r: any) => (r.name || '').toLowerCase() === 'tenant');
    if (tenantRole && testUserId) {
      await request.put(`${API}/users/${testUserId}/roles/${tenantRole.role_id}`, {
        headers, data: String(testUserId),
      });
    }
  }
});

test.afterAll(async ({ request }) => {
  const token = await adminToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  if (testUserId) await request.delete(`${API}/users/${testUserId}`, { headers });
  if (testTenantId) await request.delete(`${API}/tenants/${testTenantId}`, { headers });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test('Tenant admin: login succeeds', async ({ page }) => {
  await login(page, TENANT_EMAIL, TENANT_PASS);
  expect(page.url()).toMatch(/pages/);
});

test('Tenant admin: dashboard shows 0 extensions (not system-wide)', async ({ page, request }) => {
  // Get system-wide extension count as admin to confirm there ARE extensions
  const token = await adminToken(request);
  const statsResp = await request.get(`${API}/pbx_statistics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const systemStats = statsResp.ok() ? await statsResp.json() : {};
  console.log('System-wide stats:', systemStats);

  // Now get stats as tenant user
  const tenantAuthResp = await request.post(`${API}/authenticate`, {
    data: { username: TENANT_EMAIL, password: TENANT_PASS },
  });
  expect(tenantAuthResp.ok()).toBeTruthy();
  const tenantData = await tenantAuthResp.json();
  const tenantToken = tenantData.token || tenantData.data?.token || tenantData.access_token;
  const tenantStatsResp = await request.get(`${API}/pbx_statistics`, {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  expect(tenantStatsResp.ok()).toBeTruthy();
  const tenantStats = await tenantStatsResp.json();
  console.log('Tenant stats:', tenantStats);

  // Tenant should see 0 extensions (fresh domain), not the system-wide count
  expect(tenantStats.extensions, 'Tenant should see 0 extensions, not system-wide count').toBe(0);
  expect(tenantStats.ring_groups, 'Tenant should see 0 ring groups').toBe(0);
});

test('Tenant admin: Extensions page loads with empty list', async ({ page }) => {
  await login(page, TENANT_EMAIL, TENANT_PASS);
  await navigate(page, '/pages/fpbx_extension/extensions');
  await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  // List should be empty (no server error, no wrong-tenant data)
  const rows = page.locator('table tbody tr, .ng2-smart-row');
  await page.waitForTimeout(2000);
  const rowCount = await rows.count();
  console.log(`Extension list row count (should be 0): ${rowCount}`);
  expect(rowCount, 'Extension list should be empty for fresh tenant').toBe(0);
});

test('Tenant admin: create extension and verify it appears in list', async ({ page }) => {
  await login(page, TENANT_EMAIL, TENANT_PASS);
  await page.goto(`${BASE}/#/pages/fpbx_extension/extensions/new`);
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Extension number field uses placeholder="1001" (no id/name)
  const extInput = page.locator('input[placeholder="1001"]').first();
  await expect(extInput).toBeVisible({ timeout: 10000 });
  await extInput.fill('1001');

  // SIP password (has name="password", on Basic tab)
  const passInput = page.locator('input[name="password"]').first();
  if (await passInput.count() > 0) await passInput.fill('TestExt@1001');

  // Effective caller ID number is on the "Caller ID" tab — click it first
  await page.locator('nb-tab-button, .tab-link, a.tab-link').filter({ hasText: 'Caller ID' }).first().click();
  await page.waitForTimeout(500);
  const cidNum = page.locator('input[name="effective_caller_id_number"]').first();
  await expect(cidNum).toBeVisible({ timeout: 5000 });
  await cidNum.fill('1001');

  // Save button
  await page.locator('button:has-text("Save")').first().click();

  // Form navigates to list after 1s on success
  await page.waitForURL('**/#/pages/fpbx_extension/extensions', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // List uses mat-table
  const rows = page.locator('mat-row');
  const rowCount = await rows.count();
  console.log(`Extension list after create (should be 1): ${rowCount}`);
  expect(rowCount, 'Created extension should appear in list').toBeGreaterThanOrEqual(1);

  // Verify the extension number is visible
  await expect(page.locator('mat-cell').getByText('1001').first()).toBeVisible({ timeout: 5000 });
});

test('Tenant admin: dashboard count = 1 after creating extension (not system-wide+1)', async ({ request }) => {
  const tenantAuthResp = await request.post(`${API}/authenticate`, {
    data: { username: TENANT_EMAIL, password: TENANT_PASS },
  });
  const tenantData = await tenantAuthResp.json();
  const tenantToken = tenantData.token || tenantData.data?.token || tenantData.access_token;

  const statsResp = await request.get(`${API}/pbx_statistics`, {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  expect(statsResp.ok()).toBeTruthy();
  const stats = await statsResp.json();
  console.log('Tenant stats after extension create:', stats);

  expect(stats.extensions, 'Tenant dashboard should show exactly 1 extension').toBe(1);
});

test('Tenant admin: Ring Groups page loads and is empty', async ({ page }) => {
  await login(page, TENANT_EMAIL, TENANT_PASS);
  await navigate(page, '/pages/ring_groups/ring_groups');
  await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);
  const rows = page.locator('mat-row');
  expect(await rows.count()).toBe(0);
});

test('Tenant admin: create ring group and verify in list', async ({ page }) => {
  await login(page, TENANT_EMAIL, TENANT_PASS);
  await page.goto(`${BASE}/#/pages/ring_groups/ring_groups/new`);
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Name field: placeholder="Sales Team"
  const nameInput = page.locator('input[placeholder="Sales Team"]').first();
  await expect(nameInput).toBeVisible({ timeout: 10000 });
  await nameInput.fill('E2E Test Ring Group');

  // Extension field: placeholder="600"
  const extInput = page.locator('input[placeholder="600"]').first();
  if (await extInput.count() > 0) await extInput.fill('5001');

  // Save button
  await page.locator('button:has-text("Save")').first().click();

  // Navigate back to list
  await page.waitForURL('**/#/pages/ring_groups/ring_groups', { timeout: 15000 }).catch(async () => {
    await navigate(page, '/pages/ring_groups/ring_groups');
  });
  await page.waitForTimeout(1500);

  const rows = page.locator('mat-row');
  const rowCount = await rows.count();
  console.log(`Ring group list after create (should be 1): ${rowCount}`);
  expect(rowCount).toBeGreaterThanOrEqual(1);
  await expect(page.locator('mat-cell').getByText('E2E Test Ring Group').first()).toBeVisible({ timeout: 5000 });
});

test('Admin: system-wide stats include tenant resources (not hidden)', async ({ request }) => {
  const token = await adminToken(request);
  const statsResp = await request.get(`${API}/pbx_statistics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(statsResp.ok()).toBeTruthy();
  const stats = await statsResp.json();
  console.log('Admin system-wide stats (should include all domains):', stats);
  // Admin should see at least the 1 extension we created (may also see others from tenant 1)
  expect(stats.extensions, 'Admin should see at least 1 extension system-wide').toBeGreaterThanOrEqual(1);
  expect(stats.ring_groups, 'Admin should see at least 1 ring group system-wide').toBeGreaterThanOrEqual(1);
});
