import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = 'http://66.42.114.181';
const SS_DIR = path.join(__dirname, '../playwright-screenshots/tenant-audit');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function ss(page: any, name: string) {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: true });
}

async function loginAsTenant(page: any) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', 'user@ictcore.org');
  await page.fill('input[type="password"]', 'helloUser');
  await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
  await page.waitForURL(/\/(pages|dashboard)/, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

async function visit(page: any, url: string, label: string, filename: string) {
  await page.goto(`${BASE}/#${url}`);
  await page.waitForTimeout(2500);
  await ss(page, filename);
  const finalUrl = page.url();
  const redirected = !finalUrl.includes(url.replace('#/', '').replace('#', ''));
  console.log(`\n[${label}]`);
  console.log(`  URL: ${finalUrl}`);
  if (redirected) console.log(`  *** REDIRECTED TO: ${finalUrl.split('#')[1]} ***`);

  // Extract visible text labels and buttons
  const info = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label, th, nb-card-header, h5, h6'))
      .map((el: any) => el.innerText?.trim()).filter(Boolean).slice(0, 12);
    const buttons = Array.from(document.querySelectorAll('button, a.btn, [nbbutton]'))
      .map((el: any) => el.innerText?.trim()).filter(Boolean).slice(0, 8);
    const inputs = Array.from(document.querySelectorAll('input, select, nb-select'))
      .map((el: any) => el.placeholder || el.getAttribute('name') || el.getAttribute('formcontrolname') || '').filter(Boolean).slice(0, 8);
    return { labels, buttons, inputs };
  });
  if (info.labels.length) console.log(`  Fields: ${info.labels.join(' | ')}`);
  if (info.buttons.length) console.log(`  Buttons: ${info.buttons.join(' | ')}`);
  return !redirected;
}

test('Tenant admin UI audit - correct routes', async ({ page }) => {
  await loginAsTenant(page);
  await ss(page, '01-dashboard-after-login');

  // Capture exact menu visible to tenant
  const menuLinks = await page.$$eval('nb-menu .menu-item a', (els: any[]) =>
    els.map(el => ({ text: el.innerText?.trim(), href: el.getAttribute('href') })).filter(e => e.text)
  );
  console.log('\n=== TENANT MENU ===');
  menuLinks.forEach(m => console.log(` - ${m.text}  →  ${m.href}`));

  // 1. User Management (correct path: /pages/user/user)
  await visit(page, '/pages/user/user', 'USER MANAGEMENT LIST', '02-user-list');
  await visit(page, '/pages/user/user/new', 'ADD USER FORM', '03-add-user-form');

  // 2. PBX Extensions (correct path: /pages/fpbx_extension/extensions)
  await visit(page, '/pages/fpbx_extension/extensions', 'EXTENSIONS LIST', '04-extensions-list');
  await visit(page, '/pages/fpbx_extension/extensions/new', 'ADD EXTENSION FORM', '05-add-extension-form');

  // 3. Ring Groups
  await visit(page, '/pages/ring_groups/ring_groups', 'RING GROUPS LIST', '06-ring-groups-list');
  await visit(page, '/pages/ring_groups/ring_groups/new', 'ADD RING GROUP FORM', '07-add-ring-group-form');

  // 4. Time Conditions
  await visit(page, '/pages/time_conditions/time_conditions', 'TIME CONDITIONS LIST', '08-time-conditions');
  await visit(page, '/pages/time_conditions/time_conditions/new', 'ADD TIME CONDITION FORM', '09-add-time-condition-form');

  // 5. Inbound Routes
  await visit(page, '/pages/inbound_routes/inbound_routes', 'INBOUND ROUTES LIST', '10-inbound-routes');
  await visit(page, '/pages/inbound_routes/inbound_routes/new', 'ADD INBOUND ROUTE FORM', '11-add-inbound-route-form');

  // 6. IVR Menus
  await visit(page, '/pages/ivr_menus/ivr_menus', 'IVR MENUS LIST', '12-ivr-menus');

  // 7. Call Flows
  await visit(page, '/pages/call_flows/call_flows', 'CALL FLOWS LIST', '13-call-flows');

  // 8. Follow Me
  await visit(page, '/pages/follow_me/follow_me', 'FOLLOW ME LIST', '14-follow-me');

  // 9. Voicemails
  await visit(page, '/pages/voicemails/voicemails', 'VOICEMAILS LIST', '15-voicemails');

  // 10. Fax Accounts (admin path)
  await visit(page, '/pages/extension/extension', 'FAX ACCOUNTS (admin path)', '16-fax-accounts');

  // 11. DID Numbers (tenant routing path)
  await visit(page, '/pages/did/did', 'DID NUMBERS', '17-did-numbers');

  // 12. DID Management (admin path from earlier test)
  await visit(page, '/pages/dids/dids', 'DID MANAGEMENT', '18-did-management');

  console.log('\n=== DONE. Screenshots at:', SS_DIR, '===');
});
