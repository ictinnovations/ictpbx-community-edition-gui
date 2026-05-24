/**
 * Live call control test — FS originates to ext 9128 (pageA).
 * Tests incoming call answer, hold/unhold, transfer input, hangup.
 * Run headed (slowMo=800ms) to watch live.
 */
import { test, expect, Page } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

const BASE   = 'http://66.42.114.181';
const EMAIL  = 'admin@ictcore.org';
const PASS   = 'helloAdmin';
const SIP_WS = 'ws://66.42.114.181/ws/';

const EXT_A = { user: '9128', password: 'TestPwd123!', domain: '66.42.114.181' };

const SS = (name: string) => path.join('playwright-screenshots', `cc-${name}.png`);

// Non-blocking ESL command via plink — uses bgapi so fs_cli returns immediately
function eslBgCmd(cmd: string): void {
  const plink = '"C:\\Program Files\\PuTTY\\plink.exe"';
  const pass  = '9%nG=u#7dcZo(rgz';
  const host  = 'root@66.42.114.181';
  // bgapi returns immediately with a job UUID
  const esl   = `fs_cli -H 127.0.0.1 -P 8021 -p e530350eb86b6ece3c71dd91d86e2372 -x 'bgapi ${cmd}'`;
  try {
    execSync(`echo y | ${plink} -pw "${pass}" -batch ${host} "${esl}"`, { timeout: 8000 });
  } catch { /* ignore */ }
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', EMAIL);
  await page.fill('#input-password', PASS);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

async function registerSoftphone(page: Page, ext: typeof EXT_A) {
  // Open panel
  await page.locator('ngx-softphone .phone-btn').click();
  await expect(page.locator('ngx-softphone .softphone-panel')).toBeVisible({ timeout: 5000 });

  // Settings tab
  await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Settings' }).click();

  // Credentials
  await page.fill('ngx-softphone input[placeholder*="1001"]',   ext.user);
  await page.fill('ngx-softphone input[placeholder*="SIP pas"]', ext.password);
  await page.fill('ngx-softphone input[placeholder*="pbx.ex"]',  ext.domain);
  await page.locator('ngx-softphone input[placeholder*="wss"]').fill(SIP_WS);

  // Connect
  await page.locator('ngx-softphone .btn-save').click();

  // Wait for green registration dot
  await expect(page.locator('ngx-softphone .status-dot'))
    .toHaveClass(/status-registered/, { timeout: 25000 });

  // Go to Dialer tab
  await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Dialer' }).click();
  await expect(page.locator('ngx-softphone .softphone-panel')).toBeVisible();
}

// ── test ─────────────────────────────────────────────────────────────────────

test('hold / unhold / transfer buttons in active call', async ({ page }) => {

  // 1 — Login and register pageA as 9128 ────────────────────────────────────
  await login(page);
  await registerSoftphone(page, EXT_A);
  await page.screenshot({ path: SS('01-A-registered') });

  // 2 — FS originates a call TO 9128 via ESL ────────────────────────────────
  // FS calls 9128 and runs echo on the A-leg when answered
  eslBgCmd('originate {origination_caller_id_name=TestCall,origination_caller_id_number=5000}user/9128@66.42.114.181 &echo');
  console.log('ESL bgapi originate fired');

  // 3 — Wait for incoming ring on pageA ─────────────────────────────────────
  await expect(page.locator('ngx-softphone .btn-answer')).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: SS('02-A-ringing') });
  await page.waitForTimeout(2000);  // ← pause to see ringing state

  // 4 — Answer the call ─────────────────────────────────────────────────────
  await page.locator('ngx-softphone .btn-answer').click();

  // 5 — Active call: all 4 buttons visible ──────────────────────────────────
  await expect(page.locator('ngx-softphone .btn-mute')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('ngx-softphone .btn-hold')).toBeVisible();
  await expect(page.locator('ngx-softphone .btn-transfer')).toBeVisible();
  await expect(page.locator('ngx-softphone .btn-hangup')).toBeVisible();
  await page.screenshot({ path: SS('03-A-active-4-buttons') });
  await page.waitForTimeout(4000);   // ← PAUSE — see all 4 buttons

  // 6 — Hold ────────────────────────────────────────────────────────────────
  await page.locator('ngx-softphone .btn-hold').click();
  await expect(page.locator('ngx-softphone .call-status')).toHaveText('On Hold', { timeout: 5000 });
  await page.screenshot({ path: SS('04-on-hold') });
  await page.waitForTimeout(3000);   // ← PAUSE — see "On Hold" label

  // 7 — Unhold ──────────────────────────────────────────────────────────────
  await page.locator('ngx-softphone .btn-hold').click();
  await expect(page.locator('ngx-softphone .call-status')).toHaveText('Connected', { timeout: 5000 });
  await page.screenshot({ path: SS('05-connected-again') });
  await page.waitForTimeout(3000);   // ← PAUSE — see "Connected" restored

  // 8 — Transfer input appears ──────────────────────────────────────────────
  await page.locator('ngx-softphone .btn-transfer').click();
  await expect(page.locator('ngx-softphone .transfer-row')).toBeVisible({ timeout: 3000 });
  await page.fill('ngx-softphone .transfer-input', '44444');
  await page.screenshot({ path: SS('06-transfer-input') });
  await page.waitForTimeout(3000);   // ← PAUSE — see transfer input

  // Cancel transfer
  await page.locator('ngx-softphone .btn-xfer-cancel').click();
  await expect(page.locator('ngx-softphone .transfer-row')).not.toBeVisible();
  await page.screenshot({ path: SS('07-transfer-cancelled') });
  await page.waitForTimeout(2000);

  // 9 — Hangup ──────────────────────────────────────────────────────────────
  await page.locator('ngx-softphone .btn-hangup').click();
  await expect(page.locator('ngx-softphone .status-dot'))
    .toHaveClass(/status-registered/, { timeout: 8000 });
  await page.screenshot({ path: SS('08-A-hangup') });
});
