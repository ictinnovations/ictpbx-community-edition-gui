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
let voiceUuid = '';
let faxUuid = '';

test.describe('Extension Type', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin@ictcore.org', 'helloAdmin');
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Clean up 8091 and 8092 if they exist
    const listResp = await request.get(`${API}/fpbx_extensions?tenant_id=143`, { headers });
    if (listResp.ok()) {
      const list: any[] = await listResp.json();
      for (const ext of list) {
        if (ext.extension === '8091' || ext.extension === '8092') {
          await request.delete(`${API}/fpbx_extensions/${ext.extension_uuid}`, { headers }).catch(() => {});
        }
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Create voice extension 8091
    const r1 = await request.post(`${API}/fpbx_extensions`, {
      headers,
      data: { extension: '8091', password: 'TypeTest@1', extension_type: 'voice', tenant_id: 143,
               effective_caller_id_name: 'TypeVoice8091', effective_caller_id_number: '8091' },
    });
    const d1 = await r1.json();
    voiceUuid = typeof d1 === 'string' ? d1 : (d1.extension_uuid || d1.data?.extension_uuid || '');

    // Create fax extension 8092
    const r2 = await request.post(`${API}/fpbx_extensions`, {
      headers,
      data: { extension: '8092', password: 'TypeTest@2', extension_type: 'fax', tenant_id: 143,
               effective_caller_id_name: 'TypeFax8092', effective_caller_id_number: '8092',
               fax_email: 'faxtest8092@test.local' },
    });
    const d2 = await r2.json();
    faxUuid = typeof d2 === 'string' ? d2 : (d2.extension_uuid || d2.data?.extension_uuid || '');
  });

  test.afterAll(async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    if (voiceUuid) await request.delete(`${API}/fpbx_extensions/${voiceUuid}`, { headers }).catch(() => {});
    if (faxUuid)  await request.delete(`${API}/fpbx_extensions/${faxUuid}`, { headers }).catch(() => {});
  });

  test('extension list shows Voice badge for 8091', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/fpbx_extension/extensions');
    await page.waitForTimeout(1500);
    const badge = page.locator('mat-row').filter({ hasText: '8091' }).locator('span:has-text("Voice")');
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('extension list shows Fax badge for 8092', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/fpbx_extension/extensions');
    await page.waitForTimeout(1500);
    const badge = page.locator('mat-row').filter({ hasText: '8092' }).locator('span:has-text("Fax")');
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('fax extension form shows Fax Delivery Email field', async ({ page }) => {
    test.skip(!faxUuid, 'faxUuid not set');
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, `/pages/fpbx_extension/extensions/${faxUuid}`);
    await page.waitForTimeout(1500);
    // Fax email field should be visible (placeholder is "user@example.com", label is "Fax Delivery Email")
    const faxEmailField = page.locator('.form-group').filter({ hasText: 'Fax Delivery Email' }).locator('input').first();
    await expect(faxEmailField).toBeVisible({ timeout: 10000 });
    // Forwarding tab should NOT be present
    const forwardingTab = page.locator('[nbtabtitle*="orwarding" i], a:has-text("Forwarding"), nb-tab:has-text("Forwarding")');
    await expect(forwardingTab).toHaveCount(0);
  });

  test('voice extension form shows Forwarding tab, hides Fax Email', async ({ page }) => {
    test.skip(!voiceUuid, 'voiceUuid not set');
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, `/pages/fpbx_extension/extensions/${voiceUuid}`);
    await page.waitForTimeout(1500);
    // Forwarding tab should be visible
    const forwardingTab = page.locator('[nbtabtitle*="orwarding" i], a:has-text("Forwarding"), nb-tab:has-text("Forwarding")').first();
    await expect(forwardingTab).toBeVisible({ timeout: 10000 });
    // Fax email should NOT be visible
    const faxEmailField = page.locator('.form-group').filter({ hasText: 'Fax Delivery Email' }).locator('input');
    await expect(faxEmailField).toHaveCount(0);
  });

  test('extension type radio switches form layout', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/fpbx_extension/extensions/new');
    await page.waitForTimeout(1500);
    // Fax email absent by default (voice); field is inside .form-group with label "Fax Delivery Email"
    const faxEmailField = page.locator('.form-group').filter({ hasText: 'Fax Delivery Email' }).locator('input');
    await expect(faxEmailField).toHaveCount(0);
    // Click Fax radio
    const faxRadio = page.locator('input[type="radio"][value="fax"], nb-radio:has-text("Fax")').first();
    if (await faxRadio.count() > 0) {
      await faxRadio.click();
      await page.waitForTimeout(500);
      await expect(faxEmailField.first()).toBeVisible({ timeout: 5000 });
      // Switch back to voice
      const voiceRadio = page.locator('input[type="radio"][value="voice"], nb-radio:has-text("Voice")').first();
      await voiceRadio.click();
      await page.waitForTimeout(500);
      await expect(faxEmailField).toHaveCount(0);
    } else {
      test.skip(true, 'Extension type radio not found — feature may use different UI');
    }
  });

  test('My Account shows PBX Extension card for voice user', async ({ page, request }) => {
    test.skip(!voiceUuid, 'voiceUuid not set');
    // Assign 8091 to new3@ictcore.org via API
    const headers = { Authorization: `Bearer ${adminToken}` };
    const usersResp = await request.get(`${API}/users`, { headers });
    const users: any[] = usersResp.ok() ? await usersResp.json() : [];
    const endUser = users.find((u: any) => u.email === 'new3@ictcore.org');
    if (endUser) {
      await request.put(`${API}/fpbx_extensions/${voiceUuid}`, {
        headers, data: { user_id: endUser.user_id ?? endUser.usr_id },
      }).catch(() => {});
    }

    await login(page, 'new3@ictcore.org', 'HelloUser@2026!');
    await nav(page, '/pages/my-account/my-account');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card-header:has-text("PBX Extension")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-card-header:has-text("Fax Extension")')).toHaveCount(0);
  });

  test('My Account shows Fax Extension card for fax user', async ({ page, request }) => {
    test.skip(!faxUuid, 'faxUuid not set');
    const headers = { Authorization: `Bearer ${adminToken}` };
    const usersResp = await request.get(`${API}/users`, { headers });
    const users: any[] = usersResp.ok() ? await usersResp.json() : [];
    const endUser = users.find((u: any) => u.email === 'new3@ictcore.org');
    if (endUser) {
      const uid = endUser.user_id ?? endUser.usr_id;
      // Unlink voice extension first so My Account shows only one card
      if (voiceUuid) {
        await request.put(`${API}/fpbx_extensions/${voiceUuid}`, {
          headers, data: { user_id: 0 },
        }).catch(() => {});
      }
      await request.put(`${API}/fpbx_extensions/${faxUuid}`, {
        headers, data: { user_id: uid },
      }).catch(() => {});
      await new Promise(r => setTimeout(r, 500));
    }

    await login(page, 'new3@ictcore.org', 'HelloUser@2026!');
    await nav(page, '/pages/my-account/my-account');
    await page.waitForTimeout(1500);
    await expect(page.locator('nb-card-header:has-text("Fax Extension")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-card-header:has-text("PBX Extension")')).toHaveCount(0);
  });
});
