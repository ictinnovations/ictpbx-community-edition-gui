import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'http://66.42.114.181';
const API  = `${BASE}/api`;
const FAX_DID_PHONE = '19005558001';

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
let faxDid: any = null;
let faxExtUuid = '';

test.describe('Fax Pipeline', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin@ictcore.org', 'helloAdmin');
    tenantToken = await getToken(request, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const tenantHeaders = { Authorization: `Bearer ${tenantToken}` };

    // Find or create test DID
    const didsResp = await request.get(`${API}/dids`, { headers: adminHeaders });
    if (didsResp.ok()) {
      const dids: any[] = await didsResp.json();
      faxDid = dids.find((d: any) => d.phone === FAX_DID_PHONE);
    }
    if (!faxDid) {
      const r = await request.post(`${API}/dids`, {
        headers: adminHeaders,
        data: { phone: FAX_DID_PHONE, description: 'e2e fax pipeline test', tenant_id: 143 },
      });
      if (r.ok()) {
        const d = await r.json();
        faxDid = d.data ?? d;
      }
    } else if (Number(faxDid.tenant_id) !== 143) {
      await request.put(`${API}/dids/${faxDid.id ?? faxDid.account_id}`, {
        headers: adminHeaders, data: { tenant_id: 143 },
      }).catch(() => {});
    }

    // Clean up fax extension 8093 if it exists from a prior run
    const listResp = await request.get(`${API}/fpbx_extensions?tenant_id=143`, { headers: adminHeaders });
    if (listResp.ok()) {
      const list: any[] = await listResp.json();
      for (const ext of list) {
        if (ext.extension === '8093') {
          await request.delete(`${API}/fpbx_extensions/${ext.extension_uuid}`, { headers: adminHeaders }).catch(() => {});
        }
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Create a fax extension 8093 under tenant 143
    const r = await request.post(`${API}/fpbx_extensions`, {
      headers: adminHeaders,
      data: {
        extension: '8093', password: 'FaxPipe@1', extension_type: 'fax', tenant_id: 143,
        effective_caller_id_name: 'FaxPipe8093', effective_caller_id_number: '8093',
        fax_email: 'faxpipe8093@test.local',
      },
    });
    if (r.ok()) {
      const d = await r.json();
      faxExtUuid = typeof d === 'string' ? d : (d.extension_uuid || d.data?.extension_uuid || '');
    }
  });

  test.afterAll(async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    if (faxExtUuid) {
      await request.delete(`${API}/fpbx_extensions/${faxExtUuid}`, { headers }).catch(() => {});
    }
  });

  test('admin DID list shows fax DID', async ({ page }) => {
    test.skip(!faxDid, 'Test DID not found or created');
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);
    const cell = page.locator('td, mat-cell').filter({ hasText: FAX_DID_PHONE }).first();
    await expect(cell).toBeVisible({ timeout: 10000 });
  });

  test('tenant DID list shows assigned DID', async ({ page }) => {
    test.skip(!faxDid, 'Test DID not found');
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);
    const cell = page.locator('td, mat-cell').filter({ hasText: FAX_DID_PHONE }).first();
    await expect(cell).toBeVisible({ timeout: 10000 });
  });

  test('fax extension 8093 appears in extension list with Fax badge', async ({ page }) => {
    test.skip(!faxExtUuid, 'Fax extension not created');
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/fpbx_extension/extensions');
    await page.waitForTimeout(1500);
    const badge = page.locator('mat-row').filter({ hasText: '8093' }).locator('span:has-text("Fax")');
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('fax extension form shows fax delivery email field', async ({ page }) => {
    test.skip(!faxExtUuid, 'Fax extension not created');
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, `/pages/fpbx_extension/extensions/${faxExtUuid}`);
    await page.waitForTimeout(1500);
    const faxEmailField = page.locator('.form-group').filter({ hasText: 'Fax Delivery Email' }).locator('input').first();
    await expect(faxEmailField).toBeVisible({ timeout: 10000 });
  });

  test('send fax form loads for end user', async ({ page }) => {
    await login(page, 'new3@ictcore.org', 'HelloUser@2026!');
    await nav(page, '/pages/sendfax/sendfax');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').first()).toHaveCount(0);
  });

  test('receive fax list page loads', async ({ page }) => {
    await login(page, 'new3@ictcore.org', 'HelloUser@2026!');
    await nav(page, '/pages/infax/infax');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').first()).toHaveCount(0);
  });

  test('fax extension API returns extension_type=fax', async ({ request }) => {
    test.skip(!faxExtUuid, 'Fax extension not created');
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.get(`${API}/fpbx_extensions/${faxExtUuid}`, { headers });
    expect(r.ok()).toBeTruthy();
    const d = await r.json();
    const data = d.data ?? d;
    expect(data.extension_type).toBe('fax');
  });
});
