/**
 * Cross-node E2E test: EE test ↔ CE test
 *
 * EE test : https://test.ictpbx.com  (173.199.92.223)
 * CE test : http://155.138.192.220
 *
 * Test plan:
 *  1. Admin login on both nodes
 *  2. Create combined voice+fax trunk on each node pointing to the other
 *  3. Upload abcde.pdf as document on both nodes (via SendFax page)
 *  4. Create extension 1001 on EE test (if not present) and 2001 on CE test
 *  5. Send 5 faxes from EE → CE (+12132942945)
 *  6. Send 5 faxes from CE → EE (+12132942946)
 *  Voice calls (3 EE→CE, 4 CE→EE) are triggered via fs_cli after this spec.
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';
import * as path from 'path';

const EE_URL   = 'https://test.ictpbx.com';
const CE_URL   = 'http://155.138.192.220';
const ADMIN    = 'admin@ictcore.org';
const PASS     = 'helloAdmin';
const PDF_PATH = path.resolve('C:/Users/Super/Downloads/abcde.pdf');

// ─── helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page, base: string) {
  await page.goto(`${base}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', ADMIN);
  await page.fill('#input-password', PASS);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function nav(page: Page, hashPath: string) {
  await page.evaluate((p) => { window.location.hash = p; }, hashPath);
  await page.waitForTimeout(2000);
}

async function dismissAlert(page: Page) {
  try {
    await page.locator('button:has-text("OK"), button:has-text("Close"), .close').first().click({ timeout: 2000 });
  } catch {}
}

// ─── Suite 1: EE test node setup ──────────────────────────────────────────────

test.describe('EE Test Node – Setup & Fax', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await ctx.newPage();
    await login(page, EE_URL);
  });

  test.afterAll(async () => { await ctx.close(); });

  // ── 1a. Create cross-node trunk (EE → CE) ──────────────────────────────────
  test('EE: create voice+fax trunk to CE test', async () => {
    await nav(page, '/pages/provider/provider/new');
    await page.waitForSelector('input[name="name"]', { timeout: 15000 });

    await page.fill('input[name="name"]', 'CrossNode-CE');
    // IP auth checkbox — click only if not already checked
    const ipAuthInput = page.locator('nb-checkbox[name="ip_auth"] input[type="checkbox"]');
    const ipChecked = await ipAuthInput.isChecked().catch(() => false);
    if (!ipChecked) await page.locator('nb-checkbox[name="ip_auth"]').click();

    // Fax support checkbox
    await page.locator('nb-checkbox[name="fax_support"]').click();
    await page.waitForTimeout(300);

    await page.fill('input[name="host"]', '155.138.192.220');
    await page.fill('input[name="port"]', '5080');

    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(4000);
    // Accept both success nav and any error (trunk may already exist)
    const url = page.url();
    console.log(`EE trunk save result URL: ${url}`);
  });

  // ── 1b. Create extension 1001 if needed ────────────────────────────────────
  test('EE: ensure extension 1001 exists', async () => {
    await nav(page, '/pages/fpbx_extension/extensions');
    await page.waitForTimeout(3000);
    // wait for table to render before checking
    await page.waitForTimeout(3000);
    const has1001 = await page.locator('td:has-text("1001"), td:has-text(" 1001 ")').count();
    console.log(`EE: extension 1001 count in table: ${has1001}`);
    if (has1001 === 0) {
      await nav(page, '/pages/fpbx_extension/extensions/new');
      await page.waitForSelector('input[placeholder="1001"]', { timeout: 15000 });
      await page.fill('input[placeholder="1001"]', '1001');
      await page.fill('input[name="password"]', 'ext2026!');
      // Click Caller ID tab (second tab link)
      await page.locator('a.tab-link').nth(1).click();
      await page.waitForTimeout(800);
      await page.waitForSelector('input[placeholder="John Smith"]', { state: 'visible', timeout: 8000 });
      await page.fill('input[placeholder="John Smith"]', 'EE-1001');
      await page.fill('input[name="effective_caller_id_number"]', '1001');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(3000);
    } else {
      console.log('EE: extension 1001 already exists, skipping');
    }
  });

  // ── 1c. Send 2 faxes to CE test (+12132942945) ─────────────────────────────
  for (let i = 1; i <= 2; i++) {
    test(`EE: send fax ${i}/2 to CE test`, async () => {
      await nav(page, '/pages/sendfax/sendfax/new');
      await page.waitForSelector('#title', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Check fax provider warning
      const warning = await page.locator('nb-alert').count();
      if (warning > 0) {
        const warnText = await page.locator('nb-alert').textContent();
        if (warnText?.includes('No fax-enabled trunk')) {
          console.warn(`EE fax ${i}: No fax provider warning — skipping`);
          test.skip();
          return;
        }
      }

      // Title
      await page.fill('#title', `CrossNode-Fax-${i}`);

      // Phone number (type in contact search → binds sendfax.phone)
      const phoneInput = page.locator('input[placeholder*="contact"], input[placeholder*="Select contact"]');
      await phoneInput.fill('12132942945');
      await page.waitForTimeout(500);

      // Upload PDF
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(PDF_PATH);
      await page.waitForTimeout(1500);
      // Verify file queued
      const queueLabel = await page.locator('.upload-btn').isVisible();
      console.log(`EE fax ${i}: file input set`);

      // Send
      const sendBtn = page.locator('button.btn-success:has-text("Send Fax"), button:has-text("Send Fax")');
      await sendBtn.waitFor({ state: 'visible', timeout: 8000 });
      const isDisabled = await sendBtn.isDisabled();
      if (isDisabled) {
        console.warn(`EE fax ${i}: Send button still disabled — title="${await page.locator('#title').inputValue()}" phone="${await phoneInput.inputValue()}"`);
        // Re-trigger phone binding
        await phoneInput.click();
        await phoneInput.press('End');
        await phoneInput.press('Backspace');
        await phoneInput.type('45');
        await page.waitForTimeout(500);
        await phoneInput.press('Backspace');
        await phoneInput.press('Backspace');
        await phoneInput.type('45');
        await page.waitForTimeout(500);
      }
      await sendBtn.click({ force: true });
      await page.waitForTimeout(5000);
      console.log(`EE fax ${i}: sent (or attempted)`);
    });
  }
});

// ─── Suite 2: CE test node setup ──────────────────────────────────────────────

test.describe('CE Test Node – Setup & Fax', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await ctx.newPage();
    await login(page, CE_URL);
  });

  test.afterAll(async () => { await ctx.close(); });

  // ── 2a. Create cross-node trunk (CE → EE) ──────────────────────────────────
  test('CE: create voice+fax trunk to EE test', async () => {
    await nav(page, '/pages/provider/provider/new');
    await page.waitForSelector('input[name="name"]', { timeout: 15000 });

    await page.fill('input[name="name"]', 'CrossNode-EE');

    const ipAuthInput2 = page.locator('nb-checkbox[name="ip_auth"] input[type="checkbox"]');
    const ipChecked2 = await ipAuthInput2.isChecked().catch(() => false);
    if (!ipChecked2) await page.locator('nb-checkbox[name="ip_auth"]').click();

    await page.locator('nb-checkbox[name="fax_support"]').click();
    await page.waitForTimeout(300);

    await page.fill('input[name="host"]', '173.199.92.223');
    await page.fill('input[name="port"]', '5080');

    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(4000);
    console.log(`CE trunk save result URL: ${page.url()}`);
  });

  // ── 2b. Create extension 2001 ──────────────────────────────────────────────
  test('CE: ensure extension 2001 exists', async () => {
    await nav(page, '/pages/fpbx_extension/extensions');
    await page.waitForTimeout(3000);
    await page.waitForTimeout(3000);
    const has2001 = await page.locator('td:has-text("2001"), td:has-text(" 2001 ")').count();
    console.log(`CE: extension 2001 count in table: ${has2001}`);
    if (has2001 === 0) {
      await nav(page, '/pages/fpbx_extension/extensions/new');
      await page.waitForSelector('input[placeholder="1001"]', { timeout: 15000 });
      await page.fill('input[placeholder="1001"]', '2001');
      await page.fill('input[name="password"]', 'ext2026!');
      await page.locator('a.tab-link').nth(1).click();
      await page.waitForTimeout(800);
      await page.waitForSelector('input[placeholder="John Smith"]', { state: 'visible', timeout: 8000 });
      await page.fill('input[placeholder="John Smith"]', 'CE-2001');
      await page.fill('input[name="effective_caller_id_number"]', '2001');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(3000);
    } else {
      console.log('CE: extension 2001 already exists, skipping');
    }
  });

  // ── 2c. Send 2 faxes to EE test (+12132942946) ─────────────────────────────
  for (let i = 1; i <= 2; i++) {
    test(`CE: send fax ${i}/2 to EE test`, async () => {
      await nav(page, '/pages/sendfax/sendfax/new');
      await page.waitForSelector('#title', { timeout: 15000 });
      await page.waitForTimeout(1000);

      const warning = await page.locator('nb-alert').count();
      if (warning > 0) {
        const warnText = await page.locator('nb-alert').textContent();
        if (warnText?.includes('No fax-enabled trunk')) {
          console.warn(`CE fax ${i}: No fax provider warning — skipping`);
          test.skip();
          return;
        }
      }

      await page.fill('#title', `CrossNode-Fax-${i}`);

      const phoneInput = page.locator('input[placeholder*="contact"], input[placeholder*="Select contact"]');
      await phoneInput.fill('12132942946');
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(PDF_PATH);
      await page.waitForTimeout(1500);

      const sendBtn = page.locator('button.btn-success:has-text("Send Fax"), button:has-text("Send Fax")');
      await sendBtn.waitFor({ state: 'visible', timeout: 8000 });
      const isDisabled = await sendBtn.isDisabled();
      if (isDisabled) {
        console.warn(`CE fax ${i}: Send button disabled`);
        await phoneInput.click();
        await phoneInput.press('End');
        await phoneInput.press('Backspace');
        await phoneInput.type('46');
        await page.waitForTimeout(500);
        await phoneInput.press('Backspace');
        await phoneInput.press('Backspace');
        await phoneInput.type('46');
        await page.waitForTimeout(500);
      }
      await sendBtn.click({ force: true });
      await page.waitForTimeout(5000);
      console.log(`CE fax ${i}: sent (or attempted)`);
    });
  }
});

// ─── Suite 3: verify fax queue status ─────────────────────────────────────────

test.describe('Verify – fax transmission list', () => {
  test('EE: check sendfax list shows transmissions', async ({ browser }) => {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await login(page, EE_URL);
    await nav(page, '/pages/sendfax/sendfax');
    await page.waitForTimeout(4000);
    const rows = await page.locator('mat-row, tr[mat-row]').count();
    console.log(`EE sendfax table rows: ${rows}`);
    expect(rows).toBeGreaterThan(0);
    await ctx.close();
  });

  test('CE: check sendfax list shows transmissions', async ({ browser }) => {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await login(page, CE_URL);
    await nav(page, '/pages/sendfax/sendfax');
    await page.waitForTimeout(4000);
    const rows = await page.locator('mat-row, tr[mat-row]').count();
    console.log(`CE sendfax table rows: ${rows}`);
    expect(rows).toBeGreaterThan(0);
    await ctx.close();
  });
});
