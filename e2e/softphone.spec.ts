import { test, expect, Page } from '@playwright/test';

const BASE    = 'http://66.42.114.181';
const EMAIL   = 'admin@ictcore.org';
const PASS    = 'helloAdmin';
const SIP_EXT = '9128';
const SIP_PWD = 'TestPwd123!';
const SIP_DOM = '66.42.114.181';
const SIP_WS  = 'ws://66.42.114.181/ws/';

async function login(page: Page) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', EMAIL);
  await page.fill('#input-password', PASS);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForSelector('nb-sidebar, nb-menu', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

test.describe('Softphone', () => {

  test('phone icon visible in header after login', async ({ page }) => {
    await login(page);
    const btn = page.locator('ngx-softphone .phone-btn');
    await expect(btn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'e2e/screenshots/softphone-icon.png' });
  });

  test('panel opens with Dialer and Settings tabs', async ({ page }) => {
    await login(page);
    await page.locator('ngx-softphone .phone-btn').click();
    const panel = page.locator('ngx-softphone .softphone-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel.locator('.sp-tabs button', { hasText: 'Dialer' })).toBeVisible();
    await expect(panel.locator('.sp-tabs button', { hasText: 'Settings' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/softphone-panel-open.png' });
  });

  test('settings tab shows correct default WS URI', async ({ page }) => {
    await login(page);
    await page.locator('ngx-softphone .phone-btn').click();
    await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Settings' }).click();
    const wsInput = page.locator('ngx-softphone input[placeholder*="wss"]');
    // defaultWsUri() should give ws://66.42.114.181/ws/ on HTTP
    await expect(wsInput).toHaveValue(/ws:\/\/66\.42\.114\.181\/ws\//, { timeout: 3000 });
    await page.screenshot({ path: 'e2e/screenshots/softphone-settings.png' });
  });

  test('registers successfully with extension 9128', async ({ page }) => {
    // Grant microphone permission so WebRTC doesn't block
    await page.context().grantPermissions(['microphone']);
    await login(page);

    // Open softphone → Settings
    await page.locator('ngx-softphone .phone-btn').click();
    await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Settings' }).click();

    // Fill credentials
    await page.fill('ngx-softphone input[placeholder*="1001"]', SIP_EXT);
    await page.fill('ngx-softphone input[placeholder*="SIP password"]', SIP_PWD);
    await page.fill('ngx-softphone input[placeholder*="pbx.example"]', SIP_DOM);

    // WS URI — clear and set explicitly
    const wsInput = page.locator('ngx-softphone input[placeholder*="wss"]');
    await wsInput.fill(SIP_WS);

    await page.screenshot({ path: 'e2e/screenshots/softphone-creds-filled.png' });

    // Click Connect
    await page.locator('ngx-softphone .btn-save').click();

    // Wait for status dot to turn green (registered)
    const statusDot = page.locator('ngx-softphone .status-dot');
    await expect(statusDot).toHaveClass(/status-registered/, { timeout: 15000 });

    // Status label should show "Ready"
    const panelStatus = page.locator('ngx-softphone .sp-status');
    await expect(panelStatus).toHaveText(/Ready/, { timeout: 5000 });

    await page.screenshot({ path: 'e2e/screenshots/softphone-registered.png' });
  });

  test('dialpad renders 12 keys and call button enabled after typing', async ({ page }) => {
    await page.context().grantPermissions(['microphone']);
    await login(page);

    // Register first
    await page.locator('ngx-softphone .phone-btn').click();
    await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Settings' }).click();
    await page.fill('ngx-softphone input[placeholder*="1001"]', SIP_EXT);
    await page.fill('ngx-softphone input[placeholder*="SIP password"]', SIP_PWD);
    await page.fill('ngx-softphone input[placeholder*="pbx.example"]', SIP_DOM);
    await page.locator('ngx-softphone input[placeholder*="wss"]').fill(SIP_WS);
    await page.locator('ngx-softphone .btn-save').click();
    await expect(page.locator('ngx-softphone .status-dot')).toHaveClass(/status-registered/, { timeout: 15000 });

    // Switch to Dialer tab
    await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Dialer' }).click();

    // 12 pad buttons
    const padBtns = page.locator('ngx-softphone .pad-btn');
    await expect(padBtns).toHaveCount(12);

    // Call button disabled initially
    const callBtn = page.locator('ngx-softphone .btn-call');
    await expect(callBtn).toBeDisabled();

    // Press some digits
    await padBtns.nth(11).click(); // '#'
    await padBtns.nth(0).click();  // '1'
    await padBtns.nth(1).click();  // '2'

    await expect(callBtn).toBeEnabled();
    await page.screenshot({ path: 'e2e/screenshots/softphone-dialpad.png' });
  });

});
