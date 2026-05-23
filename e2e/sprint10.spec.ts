/**
 * Sprint 10 UI verification — admin + tenant-admin roles
 * Tests: Realtime, PBX CDR, CDR ETL, Voicemail Greetings, Conference Live Panel, Feature Codes
 *
 * Tenant admin: uses the e2e tenant created by workflow.spec.ts Step 1.
 * Run after workflow.spec.ts OR ensure TENANT_EMAIL/TENANT_PASS account exists.
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE         = process.env.PW_BASE_URL || 'http://localhost:4201';
const ADMIN_EMAIL  = 'admin@ictcore.org';
const ADMIN_PASS   = 'helloAdmin';
const TENANT_EMAIL = 'tenant@ictcore.org';
const TENANT_PASS  = 'helloTenant';

const SCREENSHOT_DIR = path.resolve(__dirname, '../playwright-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ── helpers ────────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
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
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
}

// ── ADMIN tests ────────────────────────────────────────────────────────────────

test.describe('Admin — Sprint 10 features', () => {
  test.describe.configure({ mode: 'serial' });

  test('Admin: Realtime page loads', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/realtime');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    // Should show the calls table or empty state — no 404/error card
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toHaveCount(0);
    await shot(page, 'admin-realtime');
  });

  test('Admin: PBX CDR page loads and shows table', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/fpbx_cdr');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 12000 });
    // Table should be present
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 8000 });
    await shot(page, 'admin-pbx-cdr');
  });

  test('Admin: PBX CDR page has ETL status card', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/fpbx_cdr');
    // ETL card contains "CDR ETL" text somewhere on the page
    const etlCard = page.locator('nb-card', { hasText: /CDR ETL|ETL/i }).first();
    await expect(etlCard).toBeVisible({ timeout: 10000 });
    await shot(page, 'admin-pbx-cdr-etl');
  });

  test('Admin: CDR ETL Run button is present', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/fpbx_cdr');
    // Button shows "Run ETL Now" when idle or "RUNNING..." when active — either is acceptable
    const runBtn = page.locator('button', { hasText: /Run ETL|RUNNING/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'admin-etl-button');
  });

  test('Admin: Voicemail list loads', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/voicemails/voicemails');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await shot(page, 'admin-voicemail-list');
  });

  test('Admin: Voicemail edit form has Greetings section', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    // Navigate directly to known voicemail UUID edit page
    await navigate(page, '/pages/voicemails/voicemails/9af5b7fc-d432-42ed-8da6-3d8564205ba5');
    await page.waitForTimeout(2000);
    const greetingsHeader = page.locator('nb-card-header', { hasText: /Greetings/i });
    await expect(greetingsHeader).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="file"]')).toBeVisible({ timeout: 5000 });
    await shot(page, 'admin-voicemail-greetings');
  });

  test('Admin: Conference list loads', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/conferences/conferences');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await shot(page, 'admin-conferences');
  });

  test('Admin: Conference list has Live (people) button', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/conferences/conferences');
    await page.waitForTimeout(1000);
    // people-outline icon button should exist per row
    const peopleBtn = page.locator('button nb-icon[icon="people-outline"]').first();
    const count = await peopleBtn.count();
    if (count > 0) {
      await expect(peopleBtn).toBeVisible({ timeout: 5000 });
      // Click it — should expand the live panel
      await peopleBtn.click();
      await page.waitForTimeout(1000);
      // Panel shows "Live:" text or empty state
      const livePanel = page.locator('strong', { hasText: /Live:/i }).first();
      await expect(livePanel).toBeVisible({ timeout: 5000 });
      await shot(page, 'admin-conference-live-panel');
    } else {
      test.info().annotations.push({ type: 'info', description: 'No conferences found, skipping live panel check' });
    }
  });

  test('Admin: Feature Codes page loads', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/feature_codes');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    // Should not show 404 or error
    const error = page.locator('.alert-danger');
    const count = await error.count();
    if (count > 0) {
      const txt = await error.first().textContent();
      expect(txt).not.toMatch(/404|not found/i);
    }
    await shot(page, 'admin-feature-codes');
  });

  test('Admin: Feature Codes table or empty state visible', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await navigate(page, '/pages/feature_codes');
    const table = page.locator('table');
    const empty = page.locator('td', { hasText: /No feature codes/i });
    const either = table.or(empty);
    await expect(either.first()).toBeVisible({ timeout: 10000 });
    await shot(page, 'admin-feature-codes-table');
  });

});

// ── TENANT ADMIN tests ─────────────────────────────────────────────────────────

test.describe('Tenant Admin — Sprint 10 features', () => {
  test.describe.configure({ mode: 'serial' });

  test('Tenant: login succeeds', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    expect(page.url()).toMatch(/pages/);
    await shot(page, 'tenant-login');
  });

  test('Tenant: Realtime page loads', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/realtime');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await shot(page, 'tenant-realtime');
  });

  test('Tenant: PBX CDR page loads', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/fpbx_cdr');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 12000 });
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 8000 });
    await shot(page, 'tenant-pbx-cdr');
  });

  test('Tenant: CDR ETL Run button visible', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/fpbx_cdr');
    const runBtn = page.locator('button', { hasText: /Run ETL|RUNNING/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await shot(page, 'tenant-etl-button');
  });

  test('Tenant: Voicemail list loads', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/voicemails/voicemails');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await shot(page, 'tenant-voicemail-list');
  });

  test('Tenant: Conference list loads', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/conferences/conferences');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await shot(page, 'tenant-conferences');
  });

  test('Tenant: Feature Codes page loads', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/feature_codes');
    const card = page.locator('nb-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await shot(page, 'tenant-feature-codes');
  });

  test('Tenant: Feature Codes not blocked (no 404/403 error)', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await navigate(page, '/pages/feature_codes');
    const error = page.locator('.alert-danger');
    const count = await error.count();
    if (count > 0) {
      const txt = await error.first().textContent();
      expect(txt).not.toMatch(/404|403|access denied|not found/i);
    }
    await shot(page, 'tenant-feature-codes-check');
  });

});
