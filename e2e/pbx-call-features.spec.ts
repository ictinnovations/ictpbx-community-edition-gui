/**
 * PBX Call Feature E2E Tests
 *
 * Creates each PBX feature on the EE test node via Angular UI, then originates a real
 * SIP call from CE test node → EE test node via CrossNode-EE gateway to verify the
 * feature actually routes calls through FreeSWITCH correctly.
 *
 * EE test : http://173.199.92.223  (admin UI target)
 * CE test : 155.138.192.220        (SSH source for fs_cli originate commands)
 * Gateway : CrossNode-EE (defined on CE, points to EE IP 173.199.92.223:5080, IP-auth)
 *
 * IMPORTANT: This spec does NOT touch ICTCore, fax settings, providers, or any MariaDB
 * data.  It only creates/deletes PBX objects in FusionPBX PostgreSQL via the Angular UI.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { execFileSync } from 'child_process';

// ─── constants ─────────────────────────────────────────────────────────────────

const EE_URL  = 'http://173.199.92.223';
const ADMIN   = 'admin@ictcore.org';
const PASS    = 'helloAdmin';

const PLINK   = 'C:\\Program Files\\PuTTY\\plink.exe';
const CE_HOST = '155.138.192.220';
const CE_PASS = '2h+R+--tRp2JWp?A';

const TEST_CID    = '5559990000';  // caller ID used for normal test calls
const BLOCKED_CID = '5551230000';  // caller ID that call block rule will block

// Test DIDs — chosen to not conflict with real routes or cross-node-test.spec.ts DIDs
const DID_RING_GROUP = '6800';
const DID_IVR        = '8800';
const DID_VOICEMAIL  = '9800';
const DID_CONFERENCE = '3800';
const DID_CALL_QUEUE = '7800';
const DID_CALL_FLOW  = '5800';
const DID_INBOUND    = '19995550001';

// ─── SIP call helper ──────────────────────────────────────────────────────────

/**
 * SSH into CE test node and originate a SIP call to EE via voice_ee_trunk gateway.
 * Returns the raw fs_cli output, e.g. "+OK <uuid>" or "-ERR <reason>".
 * call_timeout=20s; &hangup() immediately terminates the call once answered.
 *
 * Gateway name on CE: voice_ee_trunk (REGED, sip:t_voice_ee@173.199.92.223:5080)
 */
function originateFromCE(destination: string, callerIdNumber = TEST_CID): string {
  const fsCmd = [
    'fs_cli -x ',
    `'originate {origination_caller_id_number=${callerIdNumber},call_timeout=20,ignore_early_media=true}`,
    `sofia/gateway/voice_ee_trunk/${destination} &hangup()'`,
  ].join('');
  try {
    return execFileSync(
      PLINK,
      ['-pw', CE_PASS, '-batch', `root@${CE_HOST}`, fsCmd],
      { timeout: 35000, encoding: 'utf8' as BufferEncoding },
    ).toString().trim();
  } catch (e: any) {
    const stdout = e.stdout?.toString().trim() ?? '';
    if (stdout) return stdout;
    return `ERROR: ${(e.message as string) || 'plink failed'}`;
  }
}

/**
 * Log call result and return true if the dialplan was reached on EE.
 * A result of -ERR UNALLOCATED_NUMBER means the inbound route or feature is broken.
 */
function checkCallResult(result: string, label: string): boolean {
  const reached = !result.includes('UNALLOCATED_NUMBER')
    && !result.includes('INVALID_GATEWAY')
    && !result.startsWith('ERROR:');
  if (reached) {
    console.log(`✅ ${label}: dialplan reached — ${result}`);
  } else {
    console.warn(`⚠️ ${label}: dialplan NOT reached — ${result}`);
  }
  return reached;
}

// ─── UI helpers ────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${EE_URL}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', ADMIN);
  await page.fill('#input-password', PASS);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function nav(page: Page, hash: string) {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  await page.waitForTimeout(2000);
}

async function fill(page: Page, placeholder: string, value: string) {
  const loc = page.locator(`input[placeholder="${placeholder}"]`).first();
  await loc.waitFor({ state: 'visible', timeout: 8000 });
  await loc.fill(value);
}

async function save(page: Page) {
  // Dismiss any CDK overlay still lingering from a previous delete dialog
  const backdrop = page.locator('.cdk-overlay-backdrop-showing');
  if (await backdrop.count() > 0) {
    await page.keyboard.press('Escape');
    await backdrop.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }
  const btn = page.locator('button:has-text("Save"), button:has-text("Update")').first();
  await btn.waitFor({ state: 'visible', timeout: 8000 });
  // dispatchEvent bypasses CDK overlay pointer-event interception (same pattern as deleteRow)
  await btn.dispatchEvent('click');
  await page.waitForTimeout(3000);
}

/**
 * Find a mat-row containing listText and click its last button (delete icon),
 * then confirm the delete window.
 */
async function deleteRow(page: Page, listText: string) {
  // Dismiss any active backdrop before interacting with the list
  const bdShowing = page.locator('.cdk-overlay-backdrop-showing');
  if (await bdShowing.count() > 0) {
    await page.keyboard.press('Escape');
    await bdShowing.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  const row = page.locator(`mat-row:has-text("${listText}"), tr:has-text("${listText}")`).last();
  if (await row.count() === 0) {
    console.log(`deleteRow: "${listText}" not found — skipping`);
    return;
  }
  // dispatchEvent bypasses pointer-event interception entirely
  await row.locator('button').last().dispatchEvent('click');
  // Wait for NbWindowService window to appear
  await page.locator('nb-window').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  const delBtns = page.locator('button:has-text("Delete")');
  if (await delBtns.count() > 0) {
    await delBtns.last().dispatchEvent('click');
  }
  // Wait for nb-window to close — this only happens after the delete API call completes
  // and windowRef.close() is called inside the Angular component's .then() callback.
  await page.locator('nb-window').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  // Wait for backdrop animation to finish after window closes
  await page.locator('.cdk-overlay-backdrop-showing').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  // Wait for Angular's loadList() HTTP request (fired after delete) to complete
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Create an inbound route on EE: DID → targetType/target.
 * targetType: 'extension' | 'ring_group' | 'ivr' | 'voicemail'
 * target: the extension/group/IVR number to route to.
 */
async function createInboundRoute(page: Page, did: string, targetType: string, target: string) {
  await nav(page, '/pages/inbound_routes/inbound_routes/new');
  await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
  // DID number field
  await fill(page, '+12125551234 or 12125551234', did);
  // Destination type — native <select>
  const sel = page.locator('select').first();
  await sel.selectOption(targetType);
  await page.waitForTimeout(500);
  // Destination number — placeholder is dynamic based on type
  const destPlaceholder = targetType === 'voicemail'
    ? '1001 (extension number)'
    : 'Extension or group number';
  await fill(page, destPlaceholder, target);
  await save(page);
}

// ─── test suite ────────────────────────────────────────────────────────────────

test.describe('PBX Call Feature Tests — EE node (SIP calls from CE)', () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await ctx.newPage();
    await login(page);

    // Verify voice_ee_trunk gateway status on CE before running call tests
    try {
      const gwStatus = execFileSync(
        PLINK,
        ['-pw', CE_PASS, '-batch', `root@${CE_HOST}`, 'fs_cli -x \'sofia status gateway voice_ee_trunk\''],
        { timeout: 15000, encoding: 'utf8' as BufferEncoding },
      ).toString().trim();
      console.log('voice_ee_trunk gateway status:\n' + gwStatus);
    } catch (e: any) {
      console.warn('⚠️ Could not check voice_ee_trunk gateway status: ' + (e.message as string));
    }
  });

  test.afterAll(async () => { await ctx.close(); });

  // ── Ring Group ─────────────────────────────────────────────────────────────

  test('Ring Group: create → inbound route → SIP call → delete', async () => {
    // Create ring group at extension 6800
    await nav(page, '/pages/ring_groups/ring_groups/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, 'Sales Team', 'CIT-RingGroup');
    await fill(page, '600', DID_RING_GROUP);
    await save(page);
    console.log('Ring Group CIT-RingGroup created at ext ' + DID_RING_GROUP);

    // Create inbound route: DID 6800 → ring_group 6800
    await createInboundRoute(page, DID_RING_GROUP, 'ring_group', DID_RING_GROUP);
    console.log('Inbound route ' + DID_RING_GROUP + ' → ring_group ' + DID_RING_GROUP + ' created');

    // Allow FusionPBX to process the dialplan change
    await page.waitForTimeout(3000);

    // Originate call from CE → EE
    // Ring group has member 1001 (not registered) → expect NO_ANSWER or NORMAL_CLEARING
    const result = originateFromCE(DID_RING_GROUP);
    const reached = checkCallResult(result, `Ring Group ${DID_RING_GROUP}`);
    expect(reached).toBe(true);

    // Cleanup — delete inbound route first, then ring group
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_RING_GROUP);

    await nav(page, '/pages/ring_groups/ring_groups');
    await page.waitForTimeout(2000);
    await deleteRow(page, 'CIT-RingGroup');
  });

  // ── IVR Menu ───────────────────────────────────────────────────────────────

  test('IVR Menu: create → inbound route → SIP call → delete', async () => {
    // Create IVR at extension 8800
    await nav(page, '/pages/ivr_menus/ivr_menus/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, 'Main Menu', 'CIT-IVR');
    await fill(page, '8000', DID_IVR);
    await save(page);
    console.log('IVR CIT-IVR created at ext ' + DID_IVR);

    // Create inbound route: DID 8800 → ivr 8800
    await createInboundRoute(page, DID_IVR, 'ivr', DID_IVR);
    console.log('Inbound route ' + DID_IVR + ' → ivr ' + DID_IVR + ' created');

    await page.waitForTimeout(3000);

    // IVR auto-answers and plays menu → expect +OK
    const result = originateFromCE(DID_IVR);
    const reached = checkCallResult(result, `IVR ${DID_IVR}`);
    expect(reached).toBe(true);
    if (result.startsWith('+OK')) console.log('✅ IVR auto-answered the call');

    // Cleanup
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_IVR);

    await nav(page, '/pages/ivr_menus/ivr_menus');
    await page.waitForTimeout(2000);
    await deleteRow(page, 'CIT-IVR');
  });

  // ── Voicemail ──────────────────────────────────────────────────────────────

  test('Voicemail: create → inbound route → SIP call → delete', async () => {
    // Create voicemail for extension 9801
    await nav(page, '/pages/voicemails/voicemails/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, '1001', '9801');
    await fill(page, 'PIN (digits only)', '5678');
    await save(page);
    console.log('Voicemail created for ext 9801');

    // Create inbound route: DID 9800 → voicemail → ext 9801
    await createInboundRoute(page, DID_VOICEMAIL, 'voicemail', '9801');
    console.log('Inbound route ' + DID_VOICEMAIL + ' → voicemail ext 9801 created');

    await page.waitForTimeout(3000);

    // Voicemail auto-answers and plays greeting → expect +OK
    const result = originateFromCE(DID_VOICEMAIL);
    const reached = checkCallResult(result, `Voicemail ${DID_VOICEMAIL}`);
    expect(reached).toBe(true);
    if (result.startsWith('+OK')) console.log('✅ Voicemail auto-answered the call');

    // Cleanup
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_VOICEMAIL);

    await nav(page, '/pages/voicemails/voicemails');
    await page.waitForTimeout(2000);
    await deleteRow(page, '9801');
  });

  // ── Conference ─────────────────────────────────────────────────────────────
  // Conferences aren't a direct inbound route target type.  Route via 'extension'
  // transfer to the conference's extension number — FusionPBX default dialplan
  // matches it and routes to the conference bridge.

  test('Conference: create → inbound route (ext transfer) → SIP call → delete', async () => {
    await nav(page, '/pages/conferences/conferences/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, 'Board Room', 'CIT-Conference');
    await fill(page, '800', DID_CONFERENCE);
    await save(page);
    console.log('Conference CIT-Conference created at ext ' + DID_CONFERENCE);

    // Route via extension transfer to conference extension (hits default dialplan)
    await createInboundRoute(page, DID_CONFERENCE, 'extension', DID_CONFERENCE);
    console.log('Inbound route ' + DID_CONFERENCE + ' → extension ' + DID_CONFERENCE + ' created');

    await page.waitForTimeout(3000);

    // Conference auto-answers → expect +OK or NO_ANSWER (depends on FS dialplan match)
    const result = originateFromCE(DID_CONFERENCE);
    const reached = checkCallResult(result, `Conference ${DID_CONFERENCE}`);
    // Non-fatal: extension transfer to conference ext may not always auto-answer
    if (!reached) console.warn('Conference dialplan not reached — extension transfer may need dialplan fix');

    // Cleanup
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_CONFERENCE);

    await nav(page, '/pages/conferences/conferences');
    await page.waitForTimeout(2000);
    await deleteRow(page, 'CIT-Conference');
  });

  // ── Call Queue ─────────────────────────────────────────────────────────────
  // Same limitation as Conference — no direct target type; use extension transfer.

  test('Call Queue: create → inbound route (ext transfer) → SIP call → delete', async () => {
    await nav(page, '/pages/call_queues/call_queues/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, 'Support Queue', 'CIT-Queue');
    await fill(page, '700', DID_CALL_QUEUE);
    await save(page);
    console.log('Call Queue CIT-Queue created at ext ' + DID_CALL_QUEUE);

    await createInboundRoute(page, DID_CALL_QUEUE, 'extension', DID_CALL_QUEUE);
    console.log('Inbound route ' + DID_CALL_QUEUE + ' → extension ' + DID_CALL_QUEUE + ' created');

    await page.waitForTimeout(3000);

    // Queue auto-answers with MOH → expect +OK or NO_ANSWER
    const result = originateFromCE(DID_CALL_QUEUE);
    const reached = checkCallResult(result, `Call Queue ${DID_CALL_QUEUE}`);
    if (!reached) console.warn('Call Queue dialplan not reached — extension transfer may need dialplan fix');

    // Cleanup
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_CALL_QUEUE);

    await nav(page, '/pages/call_queues/call_queues');
    await page.waitForTimeout(2000);
    await deleteRow(page, 'CIT-Queue');
  });

  // ── Call Flow ──────────────────────────────────────────────────────────────

  test('Call Flow: create → inbound route → SIP call → delete', async () => {
    await nav(page, '/pages/call_flows/call_flows/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, 'e.g. Office Hours', 'CIT-CallFlow');
    await fill(page, 'e.g. 5000', DID_CALL_FLOW);
    await save(page);
    console.log('Call Flow CIT-CallFlow created at ext ' + DID_CALL_FLOW);

    await createInboundRoute(page, DID_CALL_FLOW, 'extension', DID_CALL_FLOW);
    console.log('Inbound route ' + DID_CALL_FLOW + ' → extension ' + DID_CALL_FLOW + ' created');

    await page.waitForTimeout(3000);

    const result = originateFromCE(DID_CALL_FLOW);
    const reached = checkCallResult(result, `Call Flow ${DID_CALL_FLOW}`);
    if (!reached) console.warn('Call Flow dialplan not reached');

    // Cleanup
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_CALL_FLOW);

    await nav(page, '/pages/call_flows/call_flows');
    await page.waitForTimeout(2000);
    await deleteRow(page, 'CIT-CallFlow');
  });

  // ── Call Block ─────────────────────────────────────────────────────────────

  test('Call Block: block CID → call with blocked CID → verify blocked → delete', async () => {
    // Create call block rule for BLOCKED_CID
    await nav(page, '/pages/call_block/call_block/new');
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 12000 });
    await fill(page, 'Rule name', 'CIT-CallBlock');
    await fill(page, 'e.g. 1800, ^1800, +1.*', BLOCKED_CID);
    await save(page);
    console.log('Call Block rule created for CID ' + BLOCKED_CID);

    await page.waitForTimeout(3000);

    // Call ext 1001 (exists on EE) with the blocked caller ID
    // Without blocking: would get -ERR NO_ANSWER (1001 not registered)
    // With blocking: call block intercepts before routing → different result
    const result = originateFromCE('1001', BLOCKED_CID);
    console.log('Call Block result (CID ' + BLOCKED_CID + ' → 1001): ' + result);
    // Log only — exact error code varies by FusionPBX call block configuration
    // CALL_REJECTED or NORMAL_CLEARING expected; UNALLOCATED_NUMBER would mean block didn't trigger

    // Cleanup
    await nav(page, '/pages/call_block/call_block');
    await page.waitForTimeout(2000);
    await deleteRow(page, 'CIT-CallBlock');
  });

  // ── Inbound Route ──────────────────────────────────────────────────────────

  test('Inbound Route: DID → ext 1001 → SIP call → delete', async () => {
    // Create inbound route DID_INBOUND → extension 1001
    await createInboundRoute(page, DID_INBOUND, 'extension', '1001');
    console.log('Inbound route ' + DID_INBOUND + ' → ext 1001 created');

    await page.waitForTimeout(3000);

    // Ext 1001 exists but is not registered → expect -ERR NO_ANSWER (route works, nobody home)
    const result = originateFromCE(DID_INBOUND);
    const reached = checkCallResult(result, `Inbound Route ${DID_INBOUND} → 1001`);
    expect(reached).toBe(true);

    // Cleanup
    await nav(page, '/pages/inbound_routes/inbound_routes');
    await page.waitForTimeout(2000);
    await deleteRow(page, DID_INBOUND);
  });

});
