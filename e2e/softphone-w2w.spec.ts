/**
 * WebRTC phone-to-phone call test.
 * Uses pre-existing extensions in the admin FusionPBX domain (66.42.114.181):
 *   pageA: 9128 / TestPwd123!
 *   pageB: 232322 / hello
 * Both are in v_extensions with domain_name=66.42.114.181 so sofia_contact() finds them.
 * local_ext_bridge in ictcore dialplan routes the call directly between the two WebRTC sessions.
 */
import { test, expect, Page, Browser } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

function eslKillChannelsFor(...exts: string[]): void {
  // Kill any stale FS channels involving the given extensions (by cid_num or dest)
  try {
    const plink = '"C:\\Program Files\\PuTTY\\plink.exe"';
    const pass  = '9%nG=u#7dcZo(rgz';
    const host  = 'root@66.42.114.181';
    const out = execSync(
      `echo y | ${plink} -pw "${pass}" -batch ${host} "fs_cli -H 127.0.0.1 -P 8021 -p e530350eb86b6ece3c71dd91d86e2372 -x 'show channels as json'"`,
      { timeout: 8000 }
    ).toString();
    const json = out.match(/\{[\s\S]*"rows"[\s\S]*\}/)?.[0];
    if (!json) return;
    const data = JSON.parse(json);
    const rows: any[] = data.rows || [];
    for (const row of rows) {
      const uuid = row[0]; // uuid is first field
      const cid  = row[6]; // cid_num
      const dest = row[9]; // dest
      if (exts.some(e => cid === e || dest === e)) {
        eslCmd(`uuid_kill ${uuid}`);
        console.log(`Killed stale FS channel ${uuid} (cid=${cid} dest=${dest})`);
      }
    }
  } catch { /* ignore */ }
}

function eslCmd(cmd: string): string {
  const plink = '"C:\\Program Files\\PuTTY\\plink.exe"';
  const pass  = '9%nG=u#7dcZo(rgz';
  const host  = 'root@66.42.114.181';
  const esl   = `fs_cli -H 127.0.0.1 -P 8021 -p e530350eb86b6ece3c71dd91d86e2372 -x '${cmd}'`;
  try {
    return execSync(`echo y | ${plink} -pw "${pass}" -batch ${host} "${esl}"`, { timeout: 8000 }).toString();
  } catch (e: any) { return e.message || ''; }
}

const BASE   = 'http://66.42.114.181';
const SIP_WS = 'ws://66.42.114.181/ws/';

// Admin login — both pages use admin so the softphone panel is available
const ADMIN = { email: 'admin@ictcore.org', pass: 'helloAdmin' };

// Pre-existing extensions in the 66.42.114.181 FusionPBX domain
const EXT_A = { user: '9128',   password: 'TestPwd123!', domain: '66.42.114.181' };
const EXT_B = { user: '232322', password: 'hello',       domain: '66.42.114.181' };

const SS = (name: string) => path.join('playwright-screenshots', `w2w-${name}.png`);

// ── helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', ADMIN.email);
  await page.fill('#input-password', ADMIN.pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

async function registerSoftphone(page: Page, ext: typeof EXT_A) {
  await page.locator('ngx-softphone .phone-btn').click();
  await expect(page.locator('ngx-softphone .softphone-panel')).toBeVisible({ timeout: 5000 });

  await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Settings' }).click();

  await page.fill('ngx-softphone input[placeholder*="1001"]',   ext.user);
  await page.fill('ngx-softphone input[placeholder*="SIP pas"]', ext.password);
  await page.fill('ngx-softphone input[placeholder*="pbx.ex"]',  ext.domain);
  await page.locator('ngx-softphone input[placeholder*="wss"]').fill(SIP_WS);

  await page.locator('ngx-softphone .btn-save').click();

  // Wait for green dot — JsSIP fires "registered" on 200 OK REGISTER
  await expect(page.locator('ngx-softphone .status-dot'))
    .toHaveClass(/status-registered/, { timeout: 30000 });

  await page.locator('ngx-softphone .sp-tabs button', { hasText: 'Dialer' }).click();
  await expect(page.locator('ngx-softphone .softphone-panel')).toBeVisible();
}

// ── test ─────────────────────────────────────────────────────────────────────

test('webphone-to-webphone call: 9128 → 232322', async ({ browser }: { browser: Browser }) => {

  // Two independent browser contexts — grant microphone so getUserMedia works
  const ctxA = await browser.newContext({ permissions: ['microphone'] });
  const ctxB = await browser.newContext({ permissions: ['microphone'] });
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Kill any stale FS channels for our extensions before starting
  eslKillChannelsFor(EXT_A.user, EXT_B.user);

  // Capture ALL JsSIP console output on pageB and WS messages
  pageB.on('console', msg => console.log(`[B] ${msg.type()}: ${msg.text().slice(0, 200)}`));
  const wsSpy = () => {
    (window as any).__wsRecv = [];
    const OrigWS = window.WebSocket;
    (window as any).WebSocket = function(url: string, proto?: string | string[]) {
      const ws = proto ? new OrigWS(url, proto) : new OrigWS(url);
      ws.addEventListener('message', (ev: MessageEvent) => {
        if (typeof ev.data === 'string') (window as any).__wsRecv.push(ev.data.slice(0, 200));
      });
      return ws;
    };
    (window as any).WebSocket.prototype = OrigWS.prototype;
    (window as any).WebSocket.CONNECTING = OrigWS.CONNECTING;
    (window as any).WebSocket.OPEN = OrigWS.OPEN;
    (window as any).WebSocket.CLOSING = OrigWS.CLOSING;
    (window as any).WebSocket.CLOSED = OrigWS.CLOSED;
  };
  await pageB.addInitScript(wsSpy);

  try {
    // 1 — Login both pages ────────────────────────────────────────────────────
    await login(pageA);
    await login(pageB);

    // 2 — Register both softphones ────────────────────────────────────────────
    await registerSoftphone(pageA, EXT_A);
    await registerSoftphone(pageB, EXT_B);

    await pageA.screenshot({ path: SS('01-A-registered') });
    await pageB.screenshot({ path: SS('01-B-registered') });

    // Give FreeSWITCH time to propagate both registrations internally
    // before local_ext_bridge evaluates sofia_contact() for the call
    await pageA.waitForTimeout(6000);

    // ESL: confirm FS sees both registrations and sofia_contact works
    const regs = eslCmd('sofia status profile webrtc reg');
    console.log('FS webrtc registrations:\n' + regs.split('\n').slice(0, 20).join('\n'));
    const contact9128  = eslCmd('sofia_contact */9128@66.42.114.181');
    const contact232322 = eslCmd('sofia_contact */232322@66.42.114.181');
    console.log('sofia_contact 9128:',   contact9128.trim());
    console.log('sofia_contact 232322:', contact232322.trim());

    // 3 — pageA dials 232322 ──────────────────────────────────────────────────
    await pageA.fill('ngx-softphone input[placeholder*="Enter number"]', EXT_B.user);
    await pageA.locator('ngx-softphone .btn-call').click();

    await pageA.screenshot({ path: SS('02-A-calling') });
    await pageA.waitForTimeout(4000);

    // Check what FS sees after the call was placed
    const channels = eslCmd('show channels');
    console.log('FS channels after dial:\n' + channels.split('\n').slice(0, 15).join('\n'));
    const wsRecvB = await pageB.evaluate(() => (window as any).__wsRecv || []);
    const invitesB = wsRecvB.filter((m: string) => m.includes('INVITE'));
    console.log(`pageB WS recv total=${wsRecvB.length} INVITEs=${invitesB.length}`);
    if (invitesB.length) console.log('B got INVITE:', invitesB[0]);
    else console.log('pageB last 5 WS recv:', JSON.stringify(wsRecvB.slice(-5)));

    // 4 — pageB rings ─────────────────────────────────────────────────────────
    await expect(pageB.locator('ngx-softphone .btn-answer')).toBeVisible({ timeout: 20000 });
    await pageB.screenshot({ path: SS('03-B-ringing') });
    await pageA.waitForTimeout(2000);   // pause to see ringing state

    // 5 — pageB answers ───────────────────────────────────────────────────────
    await pageB.locator('ngx-softphone .btn-answer').click();

    // 6 — Both sides show active call ─────────────────────────────────────────
    await expect(pageA.locator('ngx-softphone .btn-mute')).toBeVisible({ timeout: 15000 });
    await expect(pageA.locator('ngx-softphone .btn-hold')).toBeVisible();
    await expect(pageA.locator('ngx-softphone .btn-transfer')).toBeVisible();
    await expect(pageA.locator('ngx-softphone .btn-hangup')).toBeVisible();

    await expect(pageB.locator('ngx-softphone .btn-mute')).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('ngx-softphone .btn-hold')).toBeVisible();
    await expect(pageB.locator('ngx-softphone .btn-hangup')).toBeVisible();

    await pageA.screenshot({ path: SS('04-A-active') });
    await pageB.screenshot({ path: SS('04-B-active') });
    await pageA.waitForTimeout(4000);   // pause — see both sides active

    // 7 — pageA holds ─────────────────────────────────────────────────────────
    await pageA.locator('ngx-softphone .btn-hold').click();
    await expect(pageA.locator('ngx-softphone .call-status')).toHaveText('On Hold', { timeout: 5000 });
    await pageA.screenshot({ path: SS('05-A-on-hold') });
    await pageA.waitForTimeout(3000);

    // 8 — pageA unholds ───────────────────────────────────────────────────────
    await pageA.locator('ngx-softphone .btn-hold').click();
    await expect(pageA.locator('ngx-softphone .call-status')).toHaveText('Connected', { timeout: 5000 });
    await pageA.screenshot({ path: SS('06-A-connected') });
    await pageA.waitForTimeout(3000);

    // 9 — pageA hangup ────────────────────────────────────────────────────────
    await pageA.locator('ngx-softphone .btn-hangup').click();
    await expect(pageA.locator('ngx-softphone .status-dot'))
      .toHaveClass(/status-registered/, { timeout: 8000 });
    await expect(pageB.locator('ngx-softphone .status-dot'))
      .toHaveClass(/status-registered/, { timeout: 8000 });

    await pageA.screenshot({ path: SS('07-A-ended') });
    await pageB.screenshot({ path: SS('07-B-ended') });

  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
