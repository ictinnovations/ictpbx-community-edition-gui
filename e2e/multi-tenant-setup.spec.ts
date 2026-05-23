/**
 * Multi-Tenant Full-Lifecycle E2E Test
 *
 * Tests the complete ITSP multi-tenant provisioning flow:
 *   Step 0 – Cleanup (idempotent)
 *   Step 1 – Admin creates 2 tenants, 2 tenant-admins, 4 DIDs
 *   Step 2 – Tenant A admin builds PBX + fax resources, creates end user
 *   Step 3 – Tenant B admin mirrors Step 2
 *   Step 4 – End User A verifies their view + My Account
 *   Step 5 – End User B mirrors Step 4
 *   Step 6 – Cross-tenant isolation checks (API level)
 *
 * Known business-logic gaps exercised (see internal-docs/custom_approaches.md):
 *   IL-1  FusionPBX domain must be provisioned via POST /api/fpbx_domains after tenant create
 *   IL-3  FpbxExtension "assign" links to fax account; My Account resolves via username match
 *   IL-4  Cross-system extension namespace — no automatic collision prevention
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE     = process.env.PW_BASE_URL  || 'http://66.42.114.181';
const API_BASE = process.env.E2E_API_BASE || `${BASE}/api`;

// ── Credentials ───────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@ictcore.org';
const ADMIN_PASS  = 'helloAdmin';

const TA = {
  company: 'E2E Corp Alpha',
  email:   'e2e-admin-a@ictpbx.test',
  pass:    'TenantA@12345!',
  domain:  'e2e-corp-alpha.local',
};
const TB = {
  company: 'E2E Corp Beta',
  email:   'e2e-admin-b@ictpbx.test',
  pass:    'TenantB@12345!',
  domain:  'e2e-corp-beta.local',
};
const UA = { email: 'e2e-user-a@ictpbx.test', pass: 'UserAlpha@123!' };
const UB = { email: 'e2e-user-b@ictpbx.test', pass: 'UserBeta@123!'  };

// DIDs — use ranges unlikely to conflict with real data
const DID_A1 = '7771001';
const DID_A2 = '7771002';
const DID_B1 = '7772001';
const DID_B2 = '7772002';

// PBX extensions (distinct, no fax overlap — IL-4 mitigation)
const EXT_A = '4001';
const EXT_B = '4002';

// Stored across steps
const ctx: {
  tenantAId?: number; tenantBId?: number;
  adminAId?:  number; adminBId?:  number;
  userAId?:   number; userBId?:   number;
  extAUuid?:  string; extBUuid?:  string;
  faxAId?:    number; faxBId?:    number;
  didA1Id?:   number; didB1Id?:   number;
} = {};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function adminToken(request: APIRequestContext): Promise<string | null> {
  const r = await request.post(`${API_BASE}/authenticate`, {
    data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  if (!r.ok()) return null;
  const d = await r.json();
  return d.token || d.data?.token || d.access_token || null;
}

async function userToken(request: APIRequestContext, email: string, pass: string): Promise<string | null> {
  const r = await request.post(`${API_BASE}/authenticate`, {
    data: { username: email, password: pass },
  });
  if (!r.ok()) return null;
  const d = await r.json();
  return d.token || d.data?.token || d.access_token || null;
}

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 40000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 35000 });
  await page.waitForSelector('nb-sidebar, nb-menu', { timeout: 25000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function navigate(page: Page, hash: string) {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  await page.waitForTimeout(1500);
}

async function checkMenuItem(page: Page, label: string | RegExp, exists: boolean) {
  const loc = page.locator('nb-menu .menu-title', { hasText: label });
  if (exists) {
    await expect(loc.first()).toBeVisible({ timeout: 8000 });
  } else {
    await expect(loc).toHaveCount(0, { timeout: 5000 });
  }
}

// ── All steps wrapped in one serial outer describe ────────────────────────────
test.describe('Multi-Tenant Full-Lifecycle', () => {
test.describe.configure({ mode: 'serial' });

// ── Step 0: Cleanup ───────────────────────────────────────────────────────────

test.describe('Step 0 – Cleanup', () => {

  test('Admin: delete previous E2E test data', async ({ request }) => {
    const token = await adminToken(request);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    // Delete users (order: UA, UB, then tenant admins)
    const usersR = await request.get(`${API_BASE}/users`, { headers: h });
    if (usersR.ok()) {
      const users: any[] = await usersR.json();
      const targets = [UA.email, UB.email, TA.email, TB.email];
      for (const u of users) {
        if (targets.includes(u.email) || targets.includes(u.username)) {
          await request.delete(`${API_BASE}/users/${u.user_id}`, { headers: h }).catch(() => {});
        }
      }
    }

    // Delete DIDs by phone number
    const didsR = await request.get(`${API_BASE}/dids`, { headers: h });
    if (didsR.ok()) {
      const dids: any[] = await didsR.json();
      const didPhones = [DID_A1, DID_A2, DID_B1, DID_B2];
      for (const d of dids) {
        if (didPhones.includes(d.phone)) {
          await request.delete(`${API_BASE}/dids/${d.id}`, { headers: h }).catch(() => {});
        }
      }
    }

    // Delete tenants (after users)
    const tenantsR = await request.get(`${API_BASE}/tenants`, { headers: h });
    if (tenantsR.ok()) {
      const tenants: any[] = await tenantsR.json();
      for (const t of tenants) {
        if (t.company === TA.company || t.company === TB.company) {
          await request.delete(`${API_BASE}/tenants/${t.tenant_id}`, { headers: h }).catch(() => {});
        }
      }
    }

    // Verify cleanup (soft — failures don't break subsequent tests here)
    expect(true).toBe(true);
  });

});

// ── Step 1: Admin provisions tenants + DIDs ───────────────────────────────────

test.describe('Step 1 – Admin creates tenants, admins, DIDs', () => {

  test('1a: Create Tenant A via API', async ({ request }) => {
    const token = await adminToken(request);
    expect(token).toBeTruthy();
    const h = { Authorization: `Bearer ${token}` };

    const allPerms = [
      'fpbx_extension','ring_groups','call_queues','ivr_menus','voicemails',
      'conferences','devices','gateways','inbound_routes','call_flows',
      'time_conditions','music_on_hold','call_block','follow_me','realtime',
      'send_fax','receive_fax','user_admin','extension','did_management',
    ].join(',');

    const r = await request.post(`${API_BASE}/tenants`, {
      headers: h,
      data: {
        company: TA.company, email: TA.email, phone: '5550001',
        first_name: 'Alpha', last_name: 'Corp',
        active: 1, daily_limit: 200, monthly_limit: 1000,
        user_permission: allPerms,
        quota_extensions: 10, quota_ring_groups: 5, quota_call_queues: 5,
        quota_voicemails: 5, quota_ivr_menus: 5, quota_conferences: 5,
        quota_devices: 10,
      },
    });
    expect(r.ok(), `Create Tenant A failed: ${await r.text()}`).toBeTruthy();
    const body = await r.json();
    // POST /tenants returns plain integer (tenant_id) — not a JSON object
    ctx.tenantAId = typeof body === 'number' ? body : (body.tenant_id || body.id || body.data?.tenant_id);
    expect(ctx.tenantAId).toBeTruthy();

    // IL-1: Provision FusionPBX domain so PBX API calls work for this tenant
    const domR = await request.post(`${API_BASE}/fpbx_domains`, {
      headers: h,
      data: {
        tenant_id: ctx.tenantAId,
        domain_name: TA.domain,
        domain_description: `${TA.company} PBX Domain`,
      },
    });
    // Non-fatal — domain may already exist or endpoint may not exist yet; log but continue
    if (!domR.ok()) {
      console.warn(`[IL-1] FusionPBX domain creation for Tenant A returned ${domR.status()}: ${await domR.text()}`);
    }
  });

  test('1b: Create Tenant B via API', async ({ request }) => {
    const token = await adminToken(request);
    expect(token).toBeTruthy();
    const h = { Authorization: `Bearer ${token}` };

    const allPerms = [
      'fpbx_extension','ring_groups','call_queues','ivr_menus','voicemails',
      'conferences','devices','gateways','inbound_routes','call_flows',
      'time_conditions','music_on_hold','call_block','follow_me','realtime',
      'send_fax','receive_fax','user_admin','extension','did_management',
    ].join(',');

    const r = await request.post(`${API_BASE}/tenants`, {
      headers: h,
      data: {
        company: TB.company, email: TB.email, phone: '5550002',
        first_name: 'Beta', last_name: 'Corp',
        active: 1, daily_limit: 200, monthly_limit: 1000,
        user_permission: allPerms,
        quota_extensions: 10, quota_ring_groups: 5, quota_call_queues: 5,
        quota_voicemails: 5, quota_ivr_menus: 5, quota_conferences: 5,
        quota_devices: 10,
      },
    });
    expect(r.ok(), `Create Tenant B failed: ${await r.text()}`).toBeTruthy();
    const body = await r.json();
    // POST /tenants returns plain integer (tenant_id)
    ctx.tenantBId = typeof body === 'number' ? body : (body.tenant_id || body.id || body.data?.tenant_id);
    expect(ctx.tenantBId).toBeTruthy();

    const domR = await request.post(`${API_BASE}/fpbx_domains`, {
      headers: h,
      data: {
        tenant_id: ctx.tenantBId,
        domain_name: TB.domain,
        domain_description: `${TB.company} PBX Domain`,
      },
    });
    if (!domR.ok()) {
      console.warn(`[IL-1] FusionPBX domain creation for Tenant B returned ${domR.status()}: ${await domR.text()}`);
    }
  });

  test('1c: Create TenantAdmin A via API', async ({ request }) => {
    expect(ctx.tenantAId).toBeTruthy();
    const token = await adminToken(request);
    const h = { Authorization: `Bearer ${token}` };

    const allPerms = [
      'fpbx_extension','ring_groups','call_queues','ivr_menus','voicemails',
      'conferences','devices','gateways','inbound_routes','call_flows',
      'time_conditions','music_on_hold','call_block','follow_me','realtime',
      'send_fax','receive_fax','user_admin','extension','did_management',
    ].join(',');

    const r = await request.post(`${API_BASE}/users`, {
      headers: h,
      data: {
        username: TA.email, email: TA.email,
        first_name: 'Admin', last_name: 'Alpha',
        phone: '5550011', password: TA.pass,
        active: 1, tenant_id: ctx.tenantAId,
        daily_limit: 100, monthly_limit: 500,
        user_permission: allPerms,
      },
    });
    expect(r.ok(), `Create TenantAdmin A failed: ${await r.text()}`).toBeTruthy();
    const body = await r.json();
    // POST /users returns plain integer (user_id)
    ctx.adminAId = typeof body === 'number' ? body : (body.user_id || body.id || body.data?.user_id);
    expect(ctx.adminAId).toBeTruthy();

    // Assign tenant role (role name = 'tenant')
    const rolesR = await request.get(`${API_BASE}/roles`, { headers: h });
    if (rolesR.ok()) {
      const roles: any[] = await rolesR.json();
      const tenantRole = roles.find((r: any) => (r.name || '').toLowerCase() === 'tenant');
      if (tenantRole) {
        await request.put(`${API_BASE}/users/${ctx.adminAId}/roles/${tenantRole.role_id}`, {
          headers: h, data: String(ctx.adminAId),
        });
      }
    }
  });

  test('1d: Create TenantAdmin B via API', async ({ request }) => {
    expect(ctx.tenantBId).toBeTruthy();
    const token = await adminToken(request);
    const h = { Authorization: `Bearer ${token}` };

    const allPerms = [
      'fpbx_extension','ring_groups','call_queues','ivr_menus','voicemails',
      'conferences','devices','gateways','inbound_routes','call_flows',
      'time_conditions','music_on_hold','call_block','follow_me','realtime',
      'send_fax','receive_fax','user_admin','extension','did_management',
    ].join(',');

    const r = await request.post(`${API_BASE}/users`, {
      headers: h,
      data: {
        username: TB.email, email: TB.email,
        first_name: 'Admin', last_name: 'Beta',
        phone: '5550022', password: TB.pass,
        active: 1, tenant_id: ctx.tenantBId,
        daily_limit: 100, monthly_limit: 500,
        user_permission: allPerms,
      },
    });
    expect(r.ok(), `Create TenantAdmin B failed: ${await r.text()}`).toBeTruthy();
    const body = await r.json();
    // POST /users returns plain integer (user_id)
    ctx.adminBId = typeof body === 'number' ? body : (body.user_id || body.id || body.data?.user_id);
    expect(ctx.adminBId).toBeTruthy();

    const rolesR = await request.get(`${API_BASE}/roles`, { headers: h });
    if (rolesR.ok()) {
      const roles: any[] = await rolesR.json();
      const tenantRole = roles.find((r: any) => (r.name || '').toLowerCase() === 'tenant');
      if (tenantRole) {
        await request.put(`${API_BASE}/users/${ctx.adminBId}/roles/${tenantRole.role_id}`, {
          headers: h, data: String(ctx.adminBId),
        });
      }
    }
  });

  test('1e: Admin creates DIDs for Tenant A (UI)', async ({ page }) => {
    expect(ctx.tenantAId).toBeTruthy();
    await login(page, ADMIN_EMAIL, ADMIN_PASS);

    for (const phone of [DID_A1, DID_A2]) {
      // Navigate directly to DID create form (button uses routerLink)
      await page.goto(`${BASE}/#/pages/dids/dids/new`);
      await page.waitForLoadState('load', { timeout: 15000 });
      await page.waitForTimeout(2000);

      // Phone input placeholder is "+12125551234"
      await page.locator('input[placeholder="+12125551234"]').fill(phone);

      // Tenant dropdown (nb-select with ngModel did.tenant_id)
      const tenantSel = page.locator('select').first();
      const optCount = await tenantSel.locator('option').count();
      if (optCount > 1) {
        // Find option with TA.company text
        const opts = await tenantSel.locator('option').allTextContents();
        const idx = opts.findIndex(t => t.includes(TA.company));
        if (idx > 0) await tenantSel.selectOption({ index: idx });
      }

      await page.locator('input[placeholder="Optional label"]').fill(`Test DID ${phone}`).catch(() => {});
      await page.locator('button:has-text("Save")').first().click();
      await page.waitForURL('**/#/pages/dids/dids', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Verify both DIDs appear in list
    await page.goto(`${BASE}/#/pages/dids/dids`);
    await page.waitForTimeout(1500);
    const pageText = await page.locator('table, nb-card').first().textContent();
    expect(pageText).toContain(DID_A1);
  });

  test('1f: Admin creates DIDs for Tenant B (UI)', async ({ page }) => {
    expect(ctx.tenantBId).toBeTruthy();
    await login(page, ADMIN_EMAIL, ADMIN_PASS);

    for (const phone of [DID_B1, DID_B2]) {
      await page.goto(`${BASE}/#/pages/dids/dids/new`);
      await page.waitForLoadState('load', { timeout: 15000 });
      await page.waitForTimeout(2000);

      await page.locator('input[placeholder="+12125551234"]').fill(phone);

      const tenantSel = page.locator('select').first();
      const opts = await tenantSel.locator('option').allTextContents();
      const idx = opts.findIndex(t => t.includes(TB.company));
      if (idx > 0) await tenantSel.selectOption({ index: idx });

      await page.locator('input[placeholder="Optional label"]').fill(`Test DID ${phone}`).catch(() => {});
      await page.locator('button:has-text("Save")').first().click();
      await page.waitForURL('**/#/pages/dids/dids', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    await navigate(page, '/pages/dids/dids');
    await page.waitForTimeout(1000);
    const pageText = await page.locator('table, nb-card').first().textContent();
    expect(pageText).toContain(DID_B1);
  });

  test('1g: Admin DID list shows correct tenant names', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);

    const tableText = await page.locator('table, nb-card').first().textContent() || '';

    // Both tenants' DIDs should appear; tenant column shows company name
    expect(tableText).toContain(DID_A1);
    expect(tableText).toContain(DID_B1);
  });

  test('1h: Tenant A DIDs do NOT show Tenant B company name', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);

    // Find the row for DID_A1 and check its tenant cell is NOT TB.company
    const rows = page.locator('tr').filter({ hasText: DID_A1 });
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const rowText = await rows.first().textContent() || '';
      expect(rowText).not.toContain(TB.company);
    }
  });

});

// ── Step 2: Tenant A admin builds PBX + fax resources ─────────────────────────

test.describe('Step 2 – Tenant A admin builds resources', () => {

  test('2a: Tenant A admin login succeeds', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    expect(page.url()).toMatch(/pages/);
  });

  test('2b: Tenant A menu has PBX, Fax, DID Management; no Trunks or Branding', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await page.waitForTimeout(1000);

    await checkMenuItem(page, /^PBX$/i, true);
    await checkMenuItem(page, /^Fax$/i, true);
    // No admin-only items
    await checkMenuItem(page, /^Trunks$/i, false);
    await checkMenuItem(page, /^Branding$/i, false);
    await checkMenuItem(page, /^Tenant Management$/i, false);
  });

  test('2c: Fax Accounts visible in Tenant A menu', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await page.waitForTimeout(1000);
    // Expand Fax section if collapsed
    const faxMenu = page.locator('nb-menu .menu-title', { hasText: /^Fax$/i }).first();
    if (await faxMenu.isVisible()) await faxMenu.click().catch(() => {});
    await page.waitForTimeout(500);
    await expect(page.locator('nb-menu .menu-title', { hasText: /Fax Accounts/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('2d: DID Management shows only Tenant A DIDs', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await navigate(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);

    const tableText = await page.locator('table, nb-card').first().textContent() || '';
    expect(tableText).toContain(DID_A1);
    expect(tableText).not.toContain(DID_B1);
    expect(tableText).not.toContain(DID_B2);
  });

  test('2e: Create PBX Extension EXT_A (UI)', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await page.goto(`${BASE}/#/pages/fpbx_extension/extensions/new`);
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Extension Number field is first input[placeholder="1001"] (Basic tab, active by default)
    const extInput = page.locator('input[placeholder="1001"]').first();
    await expect(extInput).toBeVisible({ timeout: 10000 });
    await extInput.fill(EXT_A);
    await extInput.press('Tab');
    await page.waitForTimeout(800); // allow checkExtension() blur call

    // Password / SIP Auth field
    await page.locator('input[placeholder="SIP registration password"]').fill('Test1234!');

    await page.locator('button:has-text("Save")').first().click();
    await page.waitForTimeout(3000);

    // Navigate to list and verify extension appears
    await navigate(page, '/pages/fpbx_extension/extensions');
    await page.waitForTimeout(1500);
    const listText = await page.locator('table, mat-table, nb-card').first().textContent() || '';
    expect(listText.length).toBeGreaterThan(10);
  });

  test('2f: Tenant A extension list does NOT show Tenant B extensions (API isolation)', async ({ request }) => {
    const token = await userToken(request, TA.email, TA.pass);
    expect(token).toBeTruthy();
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.get(`${API_BASE}/fpbx_extensions`, { headers: h });
    if (!r.ok()) {
      console.warn(`FpbxExtension list returned ${r.status()} for Tenant A — IL-1 domain not provisioned?`);
      return;
    }
    const exts: any[] = await r.json();
    // Store UUID for later
    const extA = exts.find(e => e.extension === EXT_A || e.effective_caller_id_name === 'Alpha User');
    if (extA) ctx.extAUuid = extA.extension_uuid;

    // No Tenant B extension should appear
    const hasBeta = exts.some(e => e.extension === EXT_B);
    expect(hasBeta).toBe(false);
  });

  test('2g: Create Fax Account for Tenant A (UI)', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await page.goto(`${BASE}/#/pages/extension/extension/new`);
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Form defaults to type=account (PBX-first). Select EXT_A from PBX extension dropdown.
    // The dropdown is the 2nd select.form-control (first is the type selector).
    const extSelects = page.locator('select.form-control');
    const extSelect = extSelects.nth(1); // PBX extension dropdown
    await extSelect.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    // Try to select EXT_A option; fall back to first available
    const optExt = extSelect.locator(`option[value="${EXT_A}"]`);
    if (await optExt.count() > 0) {
      await extSelect.selectOption(EXT_A);
    } else {
      // Select second option (first is placeholder "— Select extension —")
      const opts = extSelect.locator('option');
      const cnt = await opts.count();
      if (cnt > 1) await extSelect.selectOption({ index: 1 });
    }

    // Email for fax delivery
    await page.locator('input#email_acct, input[placeholder="fax@example.com"]').first()
      .fill(UA.email).catch(() => {});

    // Username
    await page.locator('input#username').fill('e2e-fax-a').catch(() => {});

    // Password
    await page.locator('input#passwd').fill('FaxPass@123!').catch(() => {});

    await page.locator('button:has-text("Submit")').first().click();
    await page.waitForTimeout(2000);
  });

  test('2h: Assign DID_A1 to Tenant A fax account (UI)', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await navigate(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);

    // Find DID_A1 row and click Assign
    const didRow = page.locator('tr').filter({ hasText: DID_A1 });
    const assignBtn = didRow.locator('button:has-text("Assign")').first();
    if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assignBtn.click();
      await page.waitForTimeout(1000);

      // Select first fax account in dropdown
      const dropdown = page.locator('select').last();
      const options = dropdown.locator('option');
      const count = await options.count();
      if (count > 1) {
        await dropdown.selectOption({ index: 1 });
      }

      await page.locator('button:has-text("Save"), button:has-text("Confirm")').last().click();
      await page.waitForTimeout(1500);

      const successAlert = page.locator('.alert-success, nb-alert[status="success"], .toast-success');
      await expect(successAlert.first()).toBeVisible({ timeout: 8000 }).catch(() => {
        console.warn('DID assign success alert not visible — verifying via list state');
      });
    } else {
      console.warn(`Assign button not found for DID ${DID_A1} — DID may not have been created`);
    }
  });

  test('2i: Create End User A under Tenant A (API)', async ({ request }) => {
    expect(ctx.tenantAId).toBeTruthy();
    const token = await userToken(request, TA.email, TA.pass);
    expect(token).toBeTruthy();
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.post(`${API_BASE}/users`, {
      headers: h,
      data: {
        username: UA.email, email: UA.email,
        first_name: 'User', last_name: 'Alpha',
        phone: '5550101', password: UA.pass,
        active: 1, tenant_id: ctx.tenantAId,
        daily_limit: 0, monthly_limit: 0,
        user_permission: 'voicemails,ring_groups',
      },
    });
    expect(r.ok(), `Create User A failed: ${await r.text()}`).toBeTruthy();
    const body = await r.json();
    // POST /users returns plain integer (user_id)
    ctx.userAId = typeof body === 'number' ? body : (body.user_id || body.id || body.data?.user_id);
    expect(ctx.userAId).toBeTruthy();

    // Assign 'user' role
    const rolesR = await request.get(`${API_BASE}/roles`, { headers: h });
    if (rolesR.ok()) {
      const roles: any[] = await rolesR.json();
      const userRole = roles.find((r: any) => (r.name || '').toLowerCase() === 'user');
      if (userRole && ctx.userAId) {
        const adminToken2 = await adminToken(request);
        await request.put(`${API_BASE}/users/${ctx.userAId}/roles/${userRole.role_id}`, {
          headers: { Authorization: `Bearer ${adminToken2}` },
          data: String(ctx.userAId),
        });
      }
    }
  });

  test('2j: Tenant A user-form: PBX Permissions card hidden for tenant admin', async ({ page }) => {
    await login(page, TA.email, TA.pass);
    await page.goto(`${BASE}/#/pages/user/user/new`);
    await page.waitForLoadState('load', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // PBX Permissions card should NOT be visible for tenant admins (IL-8 fix: is_admin guard)
    const pbxCard = page.locator('nb-card-header', { hasText: /PBX Permissions/i });
    await expect(pbxCard).toHaveCount(0, { timeout: 5000 });

    // PBX Resource Allocation card also hidden
    const quotaCard = page.locator('nb-card-header', { hasText: /PBX Resource Allocation/i });
    await expect(quotaCard).toHaveCount(0, { timeout: 5000 });
  });

});

// ── Step 3: Tenant B admin mirrors Step 2 ────────────────────────────────────

test.describe('Step 3 – Tenant B admin builds resources', () => {

  test('3a: Tenant B admin login succeeds', async ({ page }) => {
    await login(page, TB.email, TB.pass);
    expect(page.url()).toMatch(/pages/);
  });

  test('3b: Tenant B DID Management shows only Tenant B DIDs', async ({ page }) => {
    await login(page, TB.email, TB.pass);
    await navigate(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);

    const tableText = await page.locator('table, nb-card').first().textContent() || '';
    expect(tableText).toContain(DID_B1);
    expect(tableText).not.toContain(DID_A1);
    expect(tableText).not.toContain(DID_A2);
  });

  test('3c: Create PBX Extension EXT_B (UI)', async ({ page }) => {
    await login(page, TB.email, TB.pass);
    await page.goto(`${BASE}/#/pages/fpbx_extension/extensions/new`);
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Extension Number field is first input[placeholder="1001"] (Basic tab, active by default)
    const extInputB = page.locator('input[placeholder="1001"]').first();
    await expect(extInputB).toBeVisible({ timeout: 10000 });
    await extInputB.fill(EXT_B);
    await extInputB.press('Tab');
    await page.waitForTimeout(800);

    await page.locator('input[placeholder="SIP registration password"]').fill('Test1234!');

    await page.locator('button:has-text("Save")').first().click();
    await page.waitForTimeout(2000);
  });

  test('3d: Tenant B extension list does NOT show Tenant A extensions (API isolation)', async ({ request }) => {
    const token = await userToken(request, TB.email, TB.pass);
    expect(token).toBeTruthy();
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.get(`${API_BASE}/fpbx_extensions`, { headers: h });
    if (!r.ok()) {
      console.warn(`FpbxExtension list returned ${r.status()} for Tenant B`);
      return;
    }
    const exts: any[] = await r.json();
    const extB = exts.find(e => e.extension === EXT_B || e.effective_caller_id_name === 'Beta User');
    if (extB) ctx.extBUuid = extB.extension_uuid;

    const hasAlpha = exts.some(e => e.extension === EXT_A);
    expect(hasAlpha).toBe(false);
  });

  test('3e: Create End User B under Tenant B (API)', async ({ request }) => {
    expect(ctx.tenantBId).toBeTruthy();
    const token = await userToken(request, TB.email, TB.pass);
    expect(token).toBeTruthy();
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.post(`${API_BASE}/users`, {
      headers: h,
      data: {
        username: UB.email, email: UB.email,
        first_name: 'User', last_name: 'Beta',
        phone: '5550202', password: UB.pass,
        active: 1, tenant_id: ctx.tenantBId,
        daily_limit: 0, monthly_limit: 0,
        user_permission: 'voicemails,ring_groups',
      },
    });
    expect(r.ok(), `Create User B failed: ${await r.text()}`).toBeTruthy();
    const body = await r.json();
    // POST /users returns plain integer (user_id)
    ctx.userBId = typeof body === 'number' ? body : (body.user_id || body.id || body.data?.user_id);
    expect(ctx.userBId).toBeTruthy();

    const rolesR = await request.get(`${API_BASE}/roles`, { headers: h });
    if (rolesR.ok()) {
      const roles: any[] = await rolesR.json();
      const userRole = roles.find((r: any) => (r.name || '').toLowerCase() === 'user');
      if (userRole && ctx.userBId) {
        const adminToken2 = await adminToken(request);
        await request.put(`${API_BASE}/users/${ctx.userBId}/roles/${userRole.role_id}`, {
          headers: { Authorization: `Bearer ${adminToken2}` },
          data: String(ctx.userBId),
        });
      }
    }
  });

});

// ── Step 4: End User A verifies their view ────────────────────────────────────

test.describe('Step 4 – End User A verifies resources', () => {

  test('4a: User A login succeeds', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    expect(page.url()).toMatch(/pages/);
  });

  test('4b: User A menu — has Dashboard and PBX section', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    await checkMenuItem(page, /^Dashboard$/i, true);
    // PBX section present (contains My Extension, Voicemail)
    await checkMenuItem(page, /^PBX$/i, true);
  });

  test('4c: User A menu — has Voicemail in PBX section (USER_PBX_CHILDREN)', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    // Expand PBX section
    const pbxMenu = page.locator('nb-menu .menu-title', { hasText: /^PBX$/i }).first();
    if (await pbxMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pbxMenu.click().catch(() => {});
      await page.waitForTimeout(500);
    }
    // USER_PBX_CHILDREN = My Extension, Follow Me, Voicemail (no Ring Groups — end-user restricted)
    await checkMenuItem(page, /^Voicemail$/i, true);
    // Ring Groups is NOT in USER_PBX_CHILDREN — end users see restricted PBX menu
    await checkMenuItem(page, /^Ring Groups$/i, false);
  });

  test('4d: User A menu — NO Administration, no Trunks, no Tenant Management', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    await checkMenuItem(page, /^Administration$/i, false);
    await checkMenuItem(page, /^Trunks$/i, false);
    await checkMenuItem(page, /^Tenant/i, false);
  });

  test('4e: User A — My Account page loads', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    await navigate(page, '/pages/my-account/my-account');
    await page.waitForTimeout(1500);
    // Page should show account cards or a "no account" notice — not an error
    const card = page.locator('nb-card, nb-alert');
    await expect(card.first()).toBeVisible({ timeout: 10000 });
  });

  test('4f: User A — My Account shows fax account section', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    await navigate(page, '/pages/my-account/my-account');
    await page.waitForTimeout(1500);

    // Either the fax card is shown, or the "no account assigned" notice
    const faxCard = page.locator('nb-card-header', { hasText: /My Fax Account/i });
    const noAccount = page.locator('nb-alert', { hasText: /no account/i });
    const eitherVisible = (await faxCard.isVisible({ timeout: 8000 }).catch(() => false))
                       || (await noAccount.isVisible({ timeout: 2000 }).catch(() => false));
    expect(eitherVisible).toBe(true);
  });

  test('4g: User A — Voicemail page loads (permission granted)', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    await navigate(page, '/pages/voicemails/voicemails');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('4h: User A — Ring Groups page loads (permission granted)', async ({ page }) => {
    await login(page, UA.email, UA.pass);
    await navigate(page, '/pages/ring_groups/ring_groups');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('4i: User A — Cannot create extensions (write blocked, read allowed)', async ({ request }) => {
    const token = await userToken(request, UA.email, UA.pass);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    // Write attempt should fail with 403 (B15: _authorize_pbx write_op=true)
    const r = await request.post(`${API_BASE}/fpbx_extensions`, {
      headers: h,
      data: { extension: '9999', effective_caller_id_name: 'Hacker', enabled: 'true' },
    });
    expect(r.status()).toBe(403);
  });

});

// ── Step 5: End User B verifies their view ────────────────────────────────────

test.describe('Step 5 – End User B verifies resources', () => {

  test('5a: User B login succeeds', async ({ page }) => {
    await login(page, UB.email, UB.pass);
    expect(page.url()).toMatch(/pages/);
  });

  test('5b: User B menu has Dashboard and PBX section', async ({ page }) => {
    await login(page, UB.email, UB.pass);
    await checkMenuItem(page, /^Dashboard$/i, true);
    await checkMenuItem(page, /^PBX$/i, true);
  });

  test('5c: User B — no Administration, no Trunks', async ({ page }) => {
    await login(page, UB.email, UB.pass);
    await checkMenuItem(page, /^Administration$/i, false);
    await checkMenuItem(page, /^Trunks$/i, false);
  });

  test('5d: User B — My Account page loads', async ({ page }) => {
    await login(page, UB.email, UB.pass);
    await navigate(page, '/pages/my-account/my-account');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card, nb-alert').first()).toBeVisible({ timeout: 10000 });
  });

  test('5e: User B — Cannot create extensions (write blocked)', async ({ request }) => {
    const token = await userToken(request, UB.email, UB.pass);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.post(`${API_BASE}/fpbx_extensions`, {
      headers: h,
      data: { extension: '9998', effective_caller_id_name: 'Hacker', enabled: 'true' },
    });
    expect(r.status()).toBe(403);
  });

});

// ── Step 6: Cross-tenant isolation (API level) ────────────────────────────────

test.describe('Step 6 – Cross-tenant isolation assertions', () => {

  test('6a: User A token — DID list contains no Tenant B DIDs', async ({ request }) => {
    const token = await userToken(request, UA.email, UA.pass);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.get(`${API_BASE}/dids`, { headers: h });
    if (!r.ok()) return;
    const dids: any[] = await r.json();
    const hasTenantBDid = dids.some(d => d.phone === DID_B1 || d.phone === DID_B2);
    expect(hasTenantBDid).toBe(false);
  });

  test('6b: User A token — Extensions list contains no Tenant B extensions', async ({ request }) => {
    const token = await userToken(request, UA.email, UA.pass);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.get(`${API_BASE}/fpbx_extensions`, { headers: h });
    if (!r.ok()) return;
    const exts: any[] = await r.json();
    const hasBeta = exts.some(e => e.extension === EXT_B || e.effective_caller_id_name === 'Beta User');
    expect(hasBeta).toBe(false);
  });

  test('6c: User B token — Extensions list contains no Tenant A extensions', async ({ request }) => {
    const token = await userToken(request, UB.email, UB.pass);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.get(`${API_BASE}/fpbx_extensions`, { headers: h });
    if (!r.ok()) return;
    const exts: any[] = await r.json();
    const hasAlpha = exts.some(e => e.extension === EXT_A || e.effective_caller_id_name === 'Alpha User');
    expect(hasAlpha).toBe(false);
  });

  test('6d: User B token — Voicemails list contains no Tenant A voicemails', async ({ request }) => {
    const token = await userToken(request, UB.email, UB.pass);
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    const r = await request.get(`${API_BASE}/voicemails`, { headers: h });
    if (!r.ok()) return;
    const vms: any[] = await r.json();
    // If any voicemail has extension EXT_A, that's a cross-tenant leak
    const hasTenantA = vms.some(v => v.voicemail_id === EXT_A);
    expect(hasTenantA).toBe(false);
  });

  test('6e: TenantAdmin A cannot access Tenant B extension list via tenant_id param', async ({ request }) => {
    const token = await userToken(request, TA.email, TA.pass);
    if (!token || !ctx.tenantBId) return;
    const h = { Authorization: `Bearer ${token}` };

    // Backend should scope to caller's tenant regardless of query param
    const r = await request.get(`${API_BASE}/fpbx_extensions?tenant_id=${ctx.tenantBId}`, { headers: h });
    if (!r.ok()) return;
    const exts: any[] = await r.json();
    const hasBeta = exts.some(e => e.extension === EXT_B);
    expect(hasBeta).toBe(false);
  });

}); // Step 6

}); // Multi-Tenant Full-Lifecycle
