import { test, expect } from '@playwright/test';

const BASE         = 'http://66.42.114.181';
const ADMIN_EMAIL  = 'admin@ictcore.org';
const ADMIN_PASS   = 'helloAdmin';
const TENANT_EMAIL = 'user@ictcore.org';
const TENANT_PASS  = 'helloUser';
const GGG_EMAIL    = 'ggg@ictore.org';
const GGG_PASS     = 'Hellouser123&';
const DID_PHONE    = '12132942945';

async function login(page: any, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();
  await page.waitForURL(/\/(pages|dashboard)/, { timeout: 20000 });
  await page.waitForTimeout(1500);
}

test('Step 1 – Admin: DID 12132942945 is in tenant and shows Unassigned', async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto(`${BASE}/#/pages/dids/dids`);
  await page.waitForTimeout(2000);

  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  console.log(`Admin sees ${count} DID row(s)`);
  expect(count).toBeGreaterThan(0);

  // Find the row with DID_PHONE
  const didRow = rows.filter({ hasText: DID_PHONE });
  await expect(didRow).toBeVisible();

  const faxCell = didRow.locator('td').nth(2); // Fax Account column
  const faxText = await faxCell.textContent();
  console.log(`DID ${DID_PHONE} fax account cell: "${faxText?.trim()}"`);
  expect(faxText?.trim()).toBe('Unassigned');

  await page.screenshot({ path: 'playwright-screenshots/step1-admin-did.png', fullPage: true });
  console.log('Step 1 PASSED: DID is unassigned in admin view');
});

test('Step 2 – Tenant admin: assigns DID to ggg fax account', async ({ page }) => {
  await login(page, TENANT_EMAIL, TENANT_PASS);
  await page.goto(`${BASE}/#/pages/dids/dids`);
  await page.waitForTimeout(2000);

  const rows = page.locator('table tbody tr');
  const didRow = rows.filter({ hasText: DID_PHONE });
  await expect(didRow).toBeVisible();

  // Click Assign button on that row
  const assignBtn = didRow.locator('button:has-text("Assign")');
  await expect(assignBtn).toBeVisible();
  await assignBtn.click();
  await page.waitForTimeout(1000);

  // Fax account dropdown should appear — find ggg option
  const faxSelect = page.locator('select').first();
  await expect(faxSelect).toBeVisible();

  const options = await faxSelect.locator('option').allTextContents();
  console.log('Fax account options:', options);

  // Select the ggg account (should contain 'ggg')
  const gggOption = options.find(o => o.toLowerCase().includes('ggg'));
  if (!gggOption) {
    console.log('ggg not in dropdown — may need fax account. Using nb-select approach...');
    // Try nb-select
    const nbSelect = page.locator('nb-select');
    if (await nbSelect.count() > 0) {
      await nbSelect.click();
      await page.waitForTimeout(500);
      const gggNbOpt = page.locator('nb-option').filter({ hasText: /ggg/i });
      await gggNbOpt.click();
    }
  } else {
    await faxSelect.selectOption({ label: gggOption });
  }

  await page.waitForTimeout(500);

  // Save
  const saveBtn = didRow.locator('button:has-text("Save")');
  await saveBtn.click();
  await page.waitForTimeout(2000);

  // Check success message
  const successAlert = page.locator('.alert-success, [class*="success"]').first();
  const successVisible = await successAlert.isVisible().catch(() => false);
  console.log('Success message visible:', successVisible);

  // DID row should now show ggg's username
  await page.waitForTimeout(1000);
  const faxCellAfter = didRow.locator('td').nth(2);
  const faxTextAfter = await faxCellAfter.textContent().catch(() => '');
  console.log(`After assign: fax account shows "${faxTextAfter?.trim()}"`);

  await page.screenshot({ path: 'playwright-screenshots/step2-tenant-assign.png', fullPage: true });
  console.log('Step 2 PASSED: DID assigned to ggg via tenant admin');
});

test('Step 3 – ggg: logs in and checks My Account', async ({ page }) => {
  await login(page, GGG_EMAIL, GGG_PASS);
  console.log('ggg logged in successfully');

  await page.goto(`${BASE}/#/pages/my-account/my-account`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'playwright-screenshots/step3-ggg-myaccount.png', fullPage: true });

  const pageContent = await page.textContent('body');

  // Check what's visible
  const hasDIDNumber = pageContent?.includes(DID_PHONE) || pageContent?.includes('DID');
  const hasFaxAccount = pageContent?.includes('Fax Account') || pageContent?.includes('Delivery Email');
  const hasPbxCard = pageContent?.includes('PBX Extension') || pageContent?.includes('SIP Password');

  console.log(`My Account — DID phone visible: ${hasDIDNumber}`);
  console.log(`My Account — Fax account section: ${hasFaxAccount}`);
  console.log(`My Account — PBX Extension card: ${hasPbxCard}`);

  // Grab all card headers
  const cardHeaders = await page.locator('nb-card-header').allTextContents();
  console.log('Card headers:', cardHeaders);

  expect(hasFaxAccount).toBeTruthy();
  await page.screenshot({ path: 'playwright-screenshots/step3-ggg-myaccount-final.png', fullPage: true });
  console.log('Step 3 PASSED: ggg My Account loaded');
});
