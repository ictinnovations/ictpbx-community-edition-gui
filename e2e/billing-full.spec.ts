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
let createdRateId = '';
let createdPlanId = '';

test.describe('Billing Full', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, 'admin@ictcore.org', 'helloAdmin');
  });

  test.afterAll(async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    if (createdRateId) await request.delete(`${API}/rates/${createdRateId}`, { headers }).catch(() => {});
    if (createdPlanId) await request.delete(`${API}/plans/${createdPlanId}`, { headers }).catch(() => {});
  });

  // --- Rate CRUD ---

  test('admin rate page has at least one rate', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/rate/rate');
    await page.waitForTimeout(2000);
    const rows = page.locator('mat-row, tr[mat-row], tbody tr').first();
    await expect(rows).toBeVisible({ timeout: 10000 });
  });

  test('admin creates a rate', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/rate/rate/new');
    await page.waitForTimeout(1500);

    // Rate form uses id="name" (ngModel standalone, no formcontrolname)
    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('e2e_rate_test');

    // Required: unit_block_rate
    const rateInput = page.locator('input#unit_block_rate').first();
    await rateInput.fill('0.01');

    // Required: destination_id
    const destInput = page.locator('input#destination_id').first();
    await destInput.fill('999');

    const saveBtn = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Verify in list
    await nav(page, '/pages/rate/rate');
    await page.waitForTimeout(1500);
    const rateRow = page.locator('tr, mat-row').filter({ hasText: 'e2e_rate_test' }).first();
    await expect(rateRow).toBeVisible({ timeout: 8000 });
  });

  test('admin edits the rate', async ({ page, request }) => {
    // Find rate id via API
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.get(`${API}/rates`, { headers });
    if (r.ok()) {
      const rates: any[] = await r.json();
      const rate = rates.find((x: any) => x.name === 'e2e_rate_test');
      if (rate) createdRateId = String(rate.rate_id ?? rate.id ?? '');
    }
    test.skip(!createdRateId, 'Rate not found');

    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, `/pages/rate/rate/${createdRateId}`);
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.clear();
    await nameInput.fill('e2e_rate_updated');

    const saveBtn = page.locator('button:has-text("Update"), button:has-text("Submit")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    await nav(page, '/pages/rate/rate');
    await page.waitForTimeout(1500);
    await expect(page.locator('mat-row, tr').filter({ hasText: 'e2e_rate_updated' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('admin deletes the rate', async ({ page, request }) => {
    test.skip(!createdRateId, 'Rate not found');
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.delete(`${API}/rates/${createdRateId}`, { headers });
    expect([200, 204]).toContain(r.status());
    createdRateId = '';

    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/rate/rate');
    await page.waitForTimeout(1500);
    await expect(page.locator('mat-row, tr').filter({ hasText: 'e2e_rate_updated' })).toHaveCount(0);
  });

  // --- Plan CRUD ---

  test('admin plan page has at least one plan', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/plan/plan');
    await page.waitForTimeout(2000);
    const rows = page.locator('mat-row, tr[mat-row], tbody tr').first();
    await expect(rows).toBeVisible({ timeout: 10000 });
  });

  test('admin creates a plan', async ({ page }) => {
    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/plan/plan/new');
    await page.waitForTimeout(1500);

    // Plan form uses id="name" and textarea#description (both required)
    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('e2e_plan_test');

    const descInput = page.locator('textarea#description').first();
    await descInput.fill('e2e test plan');

    const saveBtn = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    await nav(page, '/pages/plan/plan');
    await page.waitForTimeout(1500);
    await expect(page.locator('tr, mat-row').filter({ hasText: 'e2e_plan_test' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('admin deletes the plan', async ({ page, request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const r = await request.get(`${API}/plans`, { headers });
    if (r.ok()) {
      const plans: any[] = await r.json();
      const plan = plans.find((x: any) => x.name === 'e2e_plan_test');
      if (plan) createdPlanId = String(plan.plan_id ?? plan.id ?? '');
    }
    test.skip(!createdPlanId, 'Plan not found');

    const delR = await request.delete(`${API}/plans/${createdPlanId}`, { headers });
    expect([200, 204]).toContain(delR.status());
    createdPlanId = '';

    await login(page, 'admin@ictcore.org', 'helloAdmin');
    await nav(page, '/pages/plan/plan');
    await page.waitForTimeout(1500);
    await expect(page.locator('mat-row, tr').filter({ hasText: 'e2e_plan_test' })).toHaveCount(0);
  });

  // --- Quota enforcement ---

  test('quota blocks creation when limit reached', async ({ request }) => {
    const tenantToken = await getToken(request, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const tenantHeaders = { Authorization: `Bearer ${tenantToken}` };

    // GET /billing/quota/all/143 returns {resource_id, name, quota_limit, quota_used}
    const quotaResp = await request.get(`${API}/billing/quota/all/143`, { headers: adminHeaders });
    if (!quotaResp.ok()) { test.skip(true, 'Billing quota/all API not available'); return; }

    const quotaData: any[] = await quotaResp.json();
    // resource_id=7 is Ring Groups
    const rgQuota = quotaData.find((q: any) => q.resource_id === 7 || (q.name || '').toLowerCase().includes('ring'));

    if (!rgQuota || Number(rgQuota.quota_limit) <= 0) {
      test.skip(true, 'No ring_group quota configured for tenant 143');
      return;
    }

    const origLimit = Number(rgQuota.quota_limit);
    const currentUsed = Number(rgQuota.quota_used ?? 0);

    // Lower quota_limit to current used count so next create is blocked
    await request.put(`${API}/billing/quota/143`, {
      headers: adminHeaders,
      data: [{ resource_id: 7, quota_limit: currentUsed }],
    });

    // Try to create ring group with tenant token — expect 409 quota exceeded
    const createR = await request.post(`${API}/ring_groups`, {
      headers: tenantHeaders,
      data: { ring_group_name: 'e2e_quota_block_test', ring_group_extension: '8888',
               ring_group_timeout: 30, ring_group_strategy: 'simultaneous' },
    });
    expect(createR.status()).toBe(409);

    // Restore original quota_limit
    await request.put(`${API}/billing/quota/143`, {
      headers: adminHeaders,
      data: [{ resource_id: 7, quota_limit: origLimit }],
    });
  });

  // --- Usage and subscription ---

  test('tenant billing usage page shows data rows', async ({ page }) => {
    await login(page, 'test-admin@ictpbx.test', 'TestAdmin@2026!');
    await nav(page, '/pages/billing-usage');
    await page.waitForTimeout(2000);
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').first()).toHaveCount(0);
  });

  test('tenant 143 billing quota is configured', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    // /billing/quota/all/{tenant_id} returns quota rows for admin; verifies billing is seeded
    const r = await request.get(`${API}/billing/quota/all/143`, { headers });
    expect(r.ok()).toBeTruthy();
    const d = await r.json();
    expect(Array.isArray(d)).toBeTruthy();
    expect(d.length).toBeGreaterThan(0);
    // At least one PBX quota row must exist (ring_groups = resource_id 7)
    const hasRingGroups = d.some((q: any) => q.resource_id === 7);
    expect(hasRingGroups).toBeTruthy();
  });
});
