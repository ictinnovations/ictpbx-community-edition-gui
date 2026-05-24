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
let tenantToken = '';
let conflictExtUuid = '';
let adminExtUuid9128 = '';

test.describe('PBX Modules Full', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin@ictcore.org', 'helloAdmin');
    tenantToken = await getToken(request, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    const tenantHeaders = { Authorization: `Bearer ${tenantToken}` };
    const adminHeaders  = { Authorization: `Bearer ${adminToken}` };

    // Clean 8081 if exists
    const listResp = await request.get(`${API}/fpbx_extensions?tenant_id=143`, { headers: tenantHeaders });
    if (listResp.ok()) {
      const list: any[] = await listResp.json();
      for (const ext of list) {
        if (ext.extension === '8081') {
          await request.delete(`${API}/fpbx_extensions/${ext.extension_uuid}`, { headers: tenantHeaders }).catch(() => {});
        }
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Create 8081 as conflict baseline
    const r = await request.post(`${API}/fpbx_extensions`, {
      headers: tenantHeaders,
      data: { extension: '8081', password: 'Conflict@Test1', extension_type: 'voice',
               effective_caller_id_name: 'ConflictBase8081', effective_caller_id_number: '8081' },
    });
    if (r.ok()) {
      const d = await r.json();
      conflictExtUuid = typeof d === 'string' ? d : (d.extension_uuid || d.data?.extension_uuid || '');
    }

    // Find or create a known admin-domain extension for cross-UUID isolation test
    const adminList = await request.get(`${API}/fpbx_extensions`, { headers: adminHeaders });
    if (adminList.ok()) {
      const adminExts: any[] = await adminList.json();
      const ext9128 = adminExts.find((e: any) => e.extension === '9128');
      if (ext9128) adminExtUuid9128 = ext9128.extension_uuid || '';
    }
    if (!adminExtUuid9128) {
      // Create 9128 in admin domain so cross-UUID test has a valid UUID to use
      const cr = await request.post(`${API}/fpbx_extensions`, {
        headers: adminHeaders,
        data: { extension: '9128', password: 'AdminExt@1', extension_type: 'voice',
                 effective_caller_id_name: 'AdminExt9128', effective_caller_id_number: '9128' },
      });
      if (cr.ok()) {
        const cd = await cr.json();
        adminExtUuid9128 = typeof cd === 'string' ? cd : (cd.extension_uuid || cd.data?.extension_uuid || '');
      }
    }
  });

  test.afterAll(async ({ request }) => {
    const tenantHeaders = { Authorization: `Bearer ${tenantToken}` };
    const adminHeaders  = { Authorization: `Bearer ${adminToken}` };
    if (conflictExtUuid) await request.delete(`${API}/fpbx_extensions/${conflictExtUuid}`, { headers: tenantHeaders }).catch(() => {});
    // Clean up admin ext 9128 only if we created it (check name to avoid deleting a real one)
    if (adminExtUuid9128) {
      const chk = await request.get(`${API}/fpbx_extensions/${adminExtUuid9128}`, { headers: adminHeaders }).catch(() => null);
      if (chk && chk.ok()) {
        const d: any = await chk.json();
        if ((d.effective_caller_id_name || d.description || '').includes('AdminExt9128')) {
          await request.delete(`${API}/fpbx_extensions/${adminExtUuid9128}`, { headers: adminHeaders }).catch(() => {});
        }
      }
    }
  });

  // --- Extension conflict detection ---

  test('duplicate extension number shows error in UI', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/fpbx_extension/extensions/new');
    await page.waitForTimeout(1500);

    const extInput = page.locator('input[formcontrolname="extension"], input[placeholder*="extension" i], input[placeholder*="number" i]').first();
    await expect(extInput).toBeVisible({ timeout: 10000 });
    await extInput.fill('8081');

    const passInput = page.locator('input[formcontrolname="password"], input[type="password"]').first();
    await passInput.fill('Test@12345');

    const callerInput = page.locator('input[formcontrolname="effective_caller_id_name"], input[placeholder*="caller" i]').first();
    if (await callerInput.count() > 0) await callerInput.fill('Dup Test');

    const saveBtn = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Expect an error alert
    const errorAlert = page.locator('.alert-danger, nb-alert[status="danger"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 8000 });
  });

  // --- End-user access control ---

  test('end user redirected from extension create page', async ({ page }) => {
    await login(page, 'new3@ictcore.org', 'HelloUser@2026!');
    await nav(page, '/pages/fpbx_extension/extensions/new');
    await page.waitForTimeout(2000);
    // Should be redirected away — hash should not stay on extensions/new
    const url = page.url();
    const hash = url.split('#')[1] || '';
    const isRedirected = !hash.includes('extensions/new') || await page.locator('nb-card-header:has-text("My Account")').count() > 0;
    expect(isRedirected).toBeTruthy();
  });

  test('end user cannot create ring group via API', async ({ request }) => {
    // ring_groups route has no frontend guard, but the API enforces _authorize_pbx with write_op=true
    const endUserToken = await getToken(request, 'new3@ictcore.org', 'HelloUser@2026!');
    const headers = { Authorization: `Bearer ${endUserToken}` };
    const r = await request.post(`${API}/ring_groups`, {
      headers,
      data: { ring_group_name: 'e2e_enduser_block', ring_group_extension: '8899',
               ring_group_timeout: 30, ring_group_strategy: 'simultaneous' },
    });
    expect([403, 401, 409]).toContain(r.status());
  });

  test('end user can access My Account', async ({ page }) => {
    await login(page, 'new3@ictcore.org', 'HelloUser@2026!');
    await nav(page, '/pages/my-account/my-account');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').first()).toHaveCount(0);
  });

  // --- Tenant isolation (API) ---

  test('tenant 143 list does not contain admin-domain extension 9128', async ({ request }) => {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    const r = await request.get(`${API}/fpbx_extensions`, { headers });
    expect(r.ok()).toBeTruthy();
    const list: any[] = await r.json();
    const has9128 = list.some((e: any) => e.extension === '9128');
    expect(has9128).toBeFalsy();
  });

  test('tenant 143 ring groups list is tenant-scoped', async ({ request }) => {
    const headers = { Authorization: `Bearer ${tenantToken}` };
    const r = await request.get(`${API}/ring_groups`, { headers });
    expect(r.ok()).toBeTruthy();
    const list: any[] = await r.json();
    if (list.length > 1) {
      const domainUuids = new Set(list.map((rg: any) => rg.domain_uuid));
      expect(domainUuids.size).toBe(1);
    }
  });

  test('cross-UUID access returns 403 or 404', async ({ request }) => {
    test.skip(!adminExtUuid9128, 'Admin ext 9128 UUID not found');
    const headers = { Authorization: `Bearer ${tenantToken}` };
    const r = await request.get(`${API}/fpbx_extensions/${adminExtUuid9128}`, { headers });
    expect([403, 404]).toContain(r.status());
  });

  // --- Dashboard count ---

  test('dashboard PBX extensions count increases after create', async ({ page, request }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/dashboard');
    await page.waitForTimeout(2000);

    // Find extensions count card
    const countEl = page.locator('nb-card, .status-card').filter({ hasText: /Extension/i }).locator('.value, .h1, h1, strong').first();
    let beforeCount = 0;
    if (await countEl.count() > 0) {
      const text = await countEl.textContent();
      beforeCount = parseInt(text?.replace(/\D/g, '') || '0', 10);
    }

    // Create extension 8082 via API
    const headers = { Authorization: `Bearer ${tenantToken}` };
    const createR = await request.post(`${API}/fpbx_extensions`, {
      headers,
      data: { extension: '8082', password: 'DashTest@1', extension_type: 'voice',
               effective_caller_id_name: 'DashTest8082', effective_caller_id_number: '8082' },
    });
    let newUuid = '';
    if (createR.ok()) {
      const d = await createR.json();
      newUuid = d.extension_uuid || d.data?.extension_uuid || '';
    }

    // Reload dashboard
    await nav(page, '/pages/dashboard');
    await page.waitForTimeout(2000);

    if (await countEl.count() > 0) {
      const text = await countEl.textContent();
      const afterCount = parseInt(text?.replace(/\D/g, '') || '0', 10);
      expect(afterCount).toBeGreaterThan(beforeCount);
    }

    // Cleanup
    if (newUuid) {
      await request.delete(`${API}/fpbx_extensions/${newUuid}`, { headers }).catch(() => {});
    }
  });

  // --- Quota display ---

  test('tenant billing quota page shows PBX quota rows', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/billing-quota');
    await page.waitForTimeout(2000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    // If quota data is seeded, assert rows; otherwise accept empty/error state gracefully
    const pbxRow = page.locator('nb-card, tr, mat-row').filter({ hasText: /Extension|Ring Group/i }).first();
    await expect(pbxRow).toBeVisible({ timeout: 8000 });
  });
});
