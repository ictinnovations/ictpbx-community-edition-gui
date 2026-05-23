import { test, expect } from '@playwright/test';

const BASE = 'http://66.42.114.181';
const API_BASE = 'http://66.42.114.181/api';
const ADMIN_EMAIL = 'admin@ictcore.org';
const ADMIN_PASS = 'helloAdmin';

async function getAdminToken(request: any): Promise<string> {
  const r = await request.post(`${API_BASE}/authenticate`, {
    data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  const body = await r.json();
  return body.token || body.data?.token || body.access_token;
}

const TS = Date.now();
const TENANT_ADMIN = { email: `ta${TS}@ictpbx.test`, pass: 'TestPass@12345!', phone: '5559877' };
const END_USER    = { email: `eu${TS}@ictpbx.test`, pass: 'TestPass@12345!', phone: '5559876' };

const ctx: any = {};

test.describe.serial('End User Create + Login', () => {

  test('1: Create tenant + tenant admin via API', async ({ request }) => {
    const token = await getAdminToken(request);
    const h = { Authorization: `Bearer ${token}` };

    const tr = await request.post(`${API_BASE}/tenants`, {
      headers: h,
      data: {
        company: `E2E EndUser Tenant ${TS}`, email: `e2e-eu-tenant-${TS}@ictpbx.test`, phone: '5551234',
        first_name: 'EU', last_name: 'Tenant', active: 1,
        daily_limit: 50000, monthly_limit: 500000,
        user_permission: 'send_fax,receive_fax,voicemails,extension',
      },
    });
    expect(tr.ok(), `Create tenant failed: ${await tr.text()}`).toBeTruthy();
    ctx.tenantId = await tr.json();

    const ur = await request.post(`${API_BASE}/users`, {
      headers: h,
      data: {
        username: TENANT_ADMIN.email, email: TENANT_ADMIN.email,
        first_name: 'TA', last_name: 'Admin', phone: TENANT_ADMIN.phone,
        password: TENANT_ADMIN.pass, active: 1, tenant_id: ctx.tenantId,
        daily_limit: 10000, monthly_limit: 100000,
        user_permission: 'send_fax,receive_fax,voicemails,extension,user_admin',
      },
    });
    expect(ur.ok(), `Create tenant admin failed: ${await ur.text()}`).toBeTruthy();
    ctx.tenantAdminId = await ur.json();

    const roles = await (await request.get(`${API_BASE}/roles`, { headers: h })).json();
    const tenantRole = roles.find((r: any) => r.name?.toLowerCase() === 'tenant');
    if (tenantRole) {
      await request.put(`${API_BASE}/users/${ctx.tenantAdminId}/roles/${tenantRole.role_id}`, {
        headers: h, data: String(ctx.tenantAdminId),
      });
    }
  });

  test('2: Tenant admin creates end user via API', async ({ request }) => {
    const tr = await request.post(`${API_BASE}/authenticate`, {
      data: { username: TENANT_ADMIN.email, password: TENANT_ADMIN.pass },
    });
    const body = await tr.json();
    const taToken = body.token || body.data?.token || body.access_token;
    expect(taToken, `Tenant admin auth failed: ${JSON.stringify(body)}`).toBeTruthy();

    const ur = await request.post(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${taToken}` },
      data: {
        username: END_USER.email, email: END_USER.email,
        first_name: 'End', last_name: 'User', phone: END_USER.phone,
        password: END_USER.pass, active: 1, tenant_id: ctx.tenantId,
        daily_limit: 10, monthly_limit: 50,
        user_permission: 'send_fax,receive_fax,voicemails',
      },
    });
    const body2 = await ur.json();
    expect(ur.ok(), `Create end user failed (${ur.status()}): ${JSON.stringify(body2)}`).toBeTruthy();
    ctx.endUserId = typeof body2 === 'number' ? body2 : body2.user_id;
  });

  test('3: End user authenticates via API', async ({ request }) => {
    const r = await request.post(`${API_BASE}/authenticate`, {
      data: { username: END_USER.email, password: END_USER.pass },
    });
    const body = await r.json();
    expect(r.ok(), `End user auth failed: ${JSON.stringify(body)}`).toBeTruthy();
    const token = body.token || body.data?.token || body.access_token;
    expect(token, 'End user token missing').toBeTruthy();
  });

  test('4: End user logs in via browser UI', async ({ page }) => {
    await page.goto(`${BASE}/#/auth/login`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.fill('#input-email', END_USER.email);
    await page.fill('#input-password', END_USER.pass);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/#/pages/**', { timeout: 40000 });
    const url = page.url();
    expect(url).toContain('/pages/');
    const menuText = await page.locator('nb-menu').textContent({ timeout: 10000 }).catch(() => '');
    expect(menuText.toLowerCase()).toMatch(/dashboard|account/i);
  });

  test('5: Tenant admin creates end user via UI form (save must succeed)', async ({ page }) => {
    await page.goto(`${BASE}/#/auth/login`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.fill('#input-email', TENANT_ADMIN.email);
    await page.fill('#input-password', TENANT_ADMIN.pass);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/#/pages/**', { timeout: 40000 });
    await page.waitForTimeout(2000);

    await page.goto(`${BASE}/#/pages/user/user/new`);
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const eu2 = `eu2-${Date.now()}@ictpbx.test`;
    await page.locator('#username').fill(eu2);
    await page.locator('#phone').fill('5559879');
    await page.locator('#first_name').fill('Test');
    await page.locator('#last_name').fill('User');
    await page.locator('#email').fill(eu2);
    // address field
    const addr = page.locator('#address');
    if (await addr.count() > 0) await addr.fill('123 Test St');
    // company field
    const co = page.locator('#company');
    if (await co.count() > 0) await co.fill('Test Co');
    // password + confirm password
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill('TestPass@12345!');
    await pwInputs.nth(1).fill('TestPass@12345!');

    const saveBtn = page.locator('button:has-text("Submit"), button:has-text("Save"), button[type="submit"]').first();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await page.waitForTimeout(4000);

    const err = await page.locator('.ict_error p').first().textContent({ timeout: 2000 }).catch(() => '');
    expect(err.trim(), `Save error shown: ${err}`).toBe('');

    // Confirm redirect away from /new (save succeeded)
    const currentUrl = page.url();
    expect(currentUrl, 'Still on /new — save may have failed').not.toContain('/new');
  });

  test('6: Cleanup', async ({ request }) => {
    const token = await getAdminToken(request);
    const h = { Authorization: `Bearer ${token}` };
    if (ctx.endUserId) await request.delete(`${API_BASE}/users/${ctx.endUserId}`, { headers: h });
    if (ctx.tenantAdminId) await request.delete(`${API_BASE}/users/${ctx.tenantAdminId}`, { headers: h });
    if (ctx.tenantId) await request.delete(`${API_BASE}/tenants/${ctx.tenantId}`, { headers: h });
  });

});
