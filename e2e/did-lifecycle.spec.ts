import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'http://66.42.114.181';
const API  = `${BASE}/api`;
const TEST_PHONE = '19995551099';

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
let didId = '';

test.describe('DID Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin@ictcore.org', 'helloAdmin');
    const headers = { Authorization: `Bearer ${adminToken}` };
    // Remove test DID if it exists
    const listResp = await request.get(`${API}/dids`, { headers });
    if (listResp.ok()) {
      const dids: any[] = await listResp.json();
      for (const d of dids) {
        if (d.phone === TEST_PHONE) {
          await request.delete(`${API}/dids/${d.id ?? d.account_id}`, { headers }).catch(() => {});
        }
      }
    }
  });

  test.afterAll(async ({ request }) => {
    if (!didId) return;
    const headers = { Authorization: `Bearer ${adminToken}` };
    await request.delete(`${API}/dids/${didId}`, { headers }).catch(() => {});
  });

  test('admin creates DID via API', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.post(`${API}/dids`, {
      headers,
      data: { phone: TEST_PHONE, description: 'e2e lifecycle test', tenant_id: 1 },
    });
    expect([200, 201]).toContain(r.status());
    const d = await r.json();
    didId = d.id ?? d.data?.id ?? d.account_id ?? d.data?.account_id ?? '';
    expect(didId).toBeTruthy();
  });

  test('DID appears in admin DID list', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);
    const cell = page.locator('td, mat-cell').filter({ hasText: TEST_PHONE }).first();
    await expect(cell).toBeVisible({ timeout: 10000 });
  });

  test('duplicate DID phone returns 409', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.post(`${API}/dids`, {
      headers,
      data: { phone: TEST_PHONE, description: 'duplicate test' },
    });
    expect(r.status()).toBe(409);
  });

  test('admin assigns DID to tenant 143 via API', async ({ request }) => {
    test.skip(!didId, 'didId not set');
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.put(`${API}/dids/${didId}`, {
      headers,
      data: { tenant_id: 143 },
    });
    expect(r.ok()).toBeTruthy();
    const getR = await request.get(`${API}/dids/${didId}`, { headers });
    const d = await getR.json();
    const data = d.data ?? d;
    expect(Number(data.tenant_id)).toBe(143);
  });

  test('tenant 143 DID list shows assigned DID', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);
    const cell = page.locator('td, mat-cell').filter({ hasText: TEST_PHONE }).first();
    await expect(cell).toBeVisible({ timeout: 10000 });
  });

  test('DID list shows voice routing info notice', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/dids/dids');
    await page.waitForTimeout(1500);
    const notice = page.locator('.alert-info').filter({ hasText: 'Inbound Route' });
    await expect(notice).toBeVisible({ timeout: 10000 });
  });

  test('admin can delete DID', async ({ request }) => {
    test.skip(!didId, 'didId not set');
    const headers = { Authorization: `Bearer ${adminToken}` };
    const delR = await request.delete(`${API}/dids/${didId}`, { headers });
    expect([200, 204]).toContain(delR.status());
    const getR = await request.get(`${API}/dids/${didId}`, { headers });
    expect([404, 400]).toContain(getR.status());
    didId = ''; // cleared — afterAll no-op
  });
});
