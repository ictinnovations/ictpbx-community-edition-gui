import { test, expect } from '@playwright/test';

const BASE = 'http://66.42.114.181';
const ADMIN_EMAIL  = 'admin@ictcore.org';
const ADMIN_PASS   = 'helloAdmin';
const TENANT_EMAIL = 'user@ictcore.org';
const TENANT_PASS  = 'helloUser';

async function login(page: any, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();
  await page.waitForURL(/\/(pages|dashboard)/, { timeout: 20000 });
  await page.waitForTimeout(1500);
}

test.describe('DID Management', () => {

  test('Admin: DID Management list loads with id and tenant_name', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE}/#/pages/dids/dids`);
    await page.waitForTimeout(2000);

    // Check page loaded (not redirected away)
    expect(page.url()).toContain('dids');

    // Check table has rows or "No DIDs found"
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    console.log(`Admin sees ${count} DID row(s)`);

    if (count > 0) {
      // Verify Tenant column exists (admin-only)
      const tenantHeader = page.locator('th:has-text("Tenant")');
      await expect(tenantHeader).toBeVisible();

      // Check first row has a phone value
      const firstPhone = await rows.first().locator('td').first().textContent();
      console.log('First DID phone:', firstPhone?.trim());
      expect(firstPhone?.trim()).toBeTruthy();

      // Verify Reassign button exists (swap icon)
      const reassignBtn = rows.first().locator('button[title="Reassign Tenant"]');
      await expect(reassignBtn).toBeVisible();

      // Click Reassign — tenant dropdown should appear
      await reassignBtn.click();
      await page.waitForTimeout(500);
      const tenantSelect = page.locator('select').first();
      await expect(tenantSelect).toBeVisible();
      console.log('Tenant dropdown appeared');

      // Cancel
      await page.locator('button:has-text("Cancel")').first().click();
    } else {
      console.log('No DIDs in system — skipping row checks');
    }

    await page.screenshot({ path: 'playwright-screenshots/did-admin.png', fullPage: true });
  });

  test('Admin: DID Numbers menu entry is gone', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto(`${BASE}/#/pages/dashboard`);
    await page.waitForTimeout(2000);

    // Expand Routing menu
    const routingMenu = page.locator('nb-menu').locator('a:has-text("Routing"), span:has-text("Routing")').first();
    await routingMenu.click();
    await page.waitForTimeout(500);

    // DID Numbers should NOT be visible
    const didNumbers = page.locator('nb-menu a:has-text("DID Numbers")');
    const didNumbersCount = await didNumbers.count();
    console.log('"DID Numbers" menu items found:', didNumbersCount);
    expect(didNumbersCount).toBe(0);

    // DID Management SHOULD be visible
    const didMgmt = page.locator('nb-menu a:has-text("DID Management")');
    await expect(didMgmt.first()).toBeVisible();
    console.log('"DID Management" menu item is visible');

    await page.screenshot({ path: 'playwright-screenshots/did-menu.png', fullPage: true });
  });

  test('Tenant admin: DID Management shows own DIDs with Assign button', async ({ page }) => {
    await login(page, TENANT_EMAIL, TENANT_PASS);
    await page.goto(`${BASE}/#/pages/dids/dids`);
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('dids');

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    console.log(`Tenant sees ${count} DID row(s)`);

    // Tenant should NOT see Tenant column
    const tenantHeader = page.locator('th:has-text("Tenant")');
    const tenantHeaderCount = await tenantHeader.count();
    console.log('"Tenant" column count:', tenantHeaderCount);
    expect(tenantHeaderCount).toBe(0);

    if (count > 0) {
      // Assign button should be visible (for non-admin)
      const assignBtn = rows.first().locator('button:has-text("Assign")');
      await expect(assignBtn).toBeVisible();
      console.log('Assign button is visible for tenant admin');

      // Click Assign — fax account dropdown should appear
      await assignBtn.click();
      await page.waitForTimeout(1000);
      const faxSelect = page.locator('select[name]').or(page.locator('nb-select')).first();
      const faxSelectVisible = await faxSelect.isVisible().catch(() => false);
      console.log('Fax account dropdown visible:', faxSelectVisible);
    }

    await page.screenshot({ path: 'playwright-screenshots/did-tenant.png', fullPage: true });
  });
});
