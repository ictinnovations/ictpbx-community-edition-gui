/**
 * Phase 3 Admin Verification
 *
 * Confirms that the Phase 3 compound-WHERE + positional-params fixes
 * don't break admin access.  Admin (no domain filter) must get HTTP 200
 * and a valid (non-empty or empty-but-not-crashed) list for every
 * PBX module that was repaired:
 *   Voicemail, ConferenceCenter, CallFlow, CallBlock,
 *   FollowMe, InboundRoute, TimeCondition
 *
 * We test at the API level (fast, no flaky UI waits) and optionally
 * spot-check the UI list page for each module.
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const BASE  = 'http://66.42.114.181';
const API   = `${BASE}/api`;
const ADMIN_EMAIL = 'admin@ictcore.org';
const ADMIN_PASS  = 'helloAdmin';

test.describe.configure({ mode: 'serial' });

// ── helpers ──────────────────────────────────────────────────────────────────

async function adminToken(request: APIRequestContext): Promise<string> {
  const r = await request.post(`${API}/authenticate`, {
    data: { username: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  expect(r.ok(), 'Admin auth failed').toBeTruthy();
  const d = await r.json();
  return d.token || d.data?.token || d.access_token;
}

// ── API list checks ───────────────────────────────────────────────────────────

const API_ENDPOINTS: [string, string][] = [
  ['voicemails',       '/voicemails'],
  ['conferences',      '/conferences'],
  ['call_flows',       '/call_flows'],
  ['call_block',       '/call_block'],
  ['follow_me',        '/follow_me'],
  ['inbound_routes',   '/inbound_routes'],
  ['time_conditions',  '/time_conditions'],
];

for (const [label, path] of API_ENDPOINTS) {
  test(`Admin API: ${label} returns 200 array`, async ({ request }) => {
    const token = await adminToken(request);
    const r = await request.get(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.text();
    console.log(`${label} status=${r.status()} body_start=${body.slice(0, 120)}`);
    expect(r.status(), `${label} should be 200, got: ${body.slice(0,200)}`).toBe(200);
    // Must be a JSON array (may be empty on a fresh system — that's fine)
    const data = JSON.parse(body);
    expect(Array.isArray(data), `${label} response should be an array`).toBe(true);
  });
}

// ── UI page smoke tests (admin) ───────────────────────────────────────────────

const UI_PAGES: [string, string][] = [
  ['Voicemails',      '/pages/voicemails/voicemails'],
  ['Conferences',     '/pages/conferences/conferences'],
  ['Call Flows',      '/pages/call_flows/call_flows'],
  ['Call Block',      '/pages/call_block/call_block'],
  ['Follow Me',       '/pages/follow_me/follow_me'],
  ['Inbound Routes',  '/pages/inbound_routes/inbound_routes'],
  ['Time Conditions', '/pages/time_conditions/time_conditions'],
];

async function adminLogin(page: any) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 30000 });
  await page.fill('#input-email', ADMIN_EMAIL);
  await page.fill('#input-password', ADMIN_PASS);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

for (const [label, hashPath] of UI_PAGES) {
  test(`Admin UI: ${label} page loads without 404`, async ({ page }) => {
    await adminLogin(page);
    await page.evaluate((p: string) => { window.location.hash = p; }, hashPath);
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // No 404 / error card
    const body = await page.content();
    const has404 = body.includes('404') && body.includes('Not Found');
    const hasError = await page.locator('nb-card:has-text("404"), .error-page, h1:has-text("404")').count();
    console.log(`${label}: url=${page.url()} has404=${has404} errorWidgets=${hasError}`);

    // nb-card should be present (the list card)
    await expect(page.locator('nb-card').first()).toBeVisible({ timeout: 10000 });
    expect(hasError, `${label} should not show a 404 error widget`).toBe(0);
  });
}
