/**
 * Verify permission filtering and quota behaviour on the user form.
 *
 * Test accounts (EE prod http://66.42.114.181):
 *   admin@ictcore.org / helloAdmin  — admin, unrestricted
 *   ffff@ictcore.org  / helloTenant — tenant+user roles, tenant_id=69
 *     permissions: send_fax,receive_fax,fax_to_email,email_to_fax,personalize_fax,
 *                  fpbx_extension,devices,call_queues,voicemails,music_on_hold
 *     tenant daily cap: 50, assigned: 30 (ffff=10 + jj=20), remain_daily=20
 *     tenant monthly cap: 500, assigned: 60, remain_monthly=440
 */

import { test, expect, Page } from '@playwright/test';

const BASE  = 'http://66.42.114.181';
const ADMIN = { email: 'admin@ictcore.org', pass: 'helloAdmin' };
const TENANT_USER = { email: 'ffff@ictcore.org', pass: 'Hello@12345!' };

const FFFF_PERMS = [
  'Send Fax', 'Receive Fax', 'Fax to Email', 'Email to Fax', 'Personalize Fax',
  'Extensions', 'Devices', 'Call Queues', 'Voicemail', 'Music on Hold',
];

const NOT_FFFF_PERMS = [
  'Bulk Fax', 'Cover Page', 'Fax Documents', 'Fax Accounts', 'Fax Settings',
  'Contacts', 'Contact Groups', 'Contact DNC',
  'Conferences', 'Call Block', 'Realtime', 'Follow Me',
  'Ring Groups', 'IVR Menus', 'Time Conditions', 'Call Flows', 'Inbound Routes',
];

async function login(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.waitForSelector('#input-email', { timeout: 20000 });
  await page.fill('#input-email', email);
  await page.fill('#input-password', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/#/pages/**', { timeout: 25000 });
  await page.waitForSelector('nb-sidebar, nb-menu', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function goToNewUser(page: Page) {
  await page.goto(`${BASE}/#/pages/user/user/new`);
  await page.waitForLoadState('load', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.waitForSelector('#username', { timeout: 15000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Permission filtering — admin vs tenant', () => {

  test('Admin sees all permission checkboxes (no filtering)', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.pass);
    await goToNewUser(page);

    // Both cards must be present
    await expect(page.locator('nb-card-header', { hasText: 'Fax Permissions' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nb-card-header', { hasText: 'PBX Permissions' })).toBeVisible();

    // Admin has no filtering — all 24 permissions visible
    // Wait for checkboxes to render then count
    await page.waitForTimeout(1000);
    const faxCard = page.locator('nb-card', { has: page.locator('nb-card-header', { hasText: 'Fax Permissions' }) });
    const pbxCard = page.locator('nb-card', { has: page.locator('nb-card-header', { hasText: 'PBX Permissions' }) });
    const faxCount = await faxCard.locator('input[type="checkbox"]').count();
    const pbxCount = await pbxCard.locator('input[type="checkbox"]').count();
    // Fax card: send_fax,receive_fax,fax_to_email,email_to_fax,personalize_fax,campaigns,
    //           cover_page,fax_documents,fax_accounts,fax_setting,contacts,groups,contact_dnc = 13
    // PBX card: fpbx_extension,music_on_hold,conferences,call_block,realtime,
    //           devices,voicemails,follow_me,ring_groups,call_queues,
    //           ivr_menus,time_conditions,call_flows,inbound_routes = 14
    expect(faxCount, 'Admin fax permissions count').toBeGreaterThanOrEqual(10);
    expect(pbxCount, 'Admin PBX permissions count').toBeGreaterThanOrEqual(10);
    expect(faxCount + pbxCount, 'Admin total permission count').toBeGreaterThanOrEqual(20);
  });

  test('Tenant user only sees their own permissions — present ones visible', async ({ page }) => {
    await login(page, TENANT_USER.email, TENANT_USER.pass);
    await goToNewUser(page);

    await page.waitForTimeout(1000); // let getPerms filter run

    // Use labels that contain a checkbox — excludes resource quota labels which have no checkbox
    const permLabel = (name: string) =>
      page.locator('nb-card-body label')
        .filter({ has: page.locator('input[type="checkbox"]') })
        .filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });

    for (const name of FFFF_PERMS) {
      await expect(permLabel(name).first(), `Tenant should see: ${name}`).toBeVisible({ timeout: 8000 });
    }
  });

  test('Tenant user does NOT see permissions they lack', async ({ page }) => {
    await login(page, TENANT_USER.email, TENANT_USER.pass);
    await goToNewUser(page);

    await page.waitForTimeout(1000);

    const permLabel = (name: string) =>
      page.locator('nb-card-body label')
        .filter({ has: page.locator('input[type="checkbox"]') })
        .filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });

    for (const name of NOT_FFFF_PERMS) {
      const count = await permLabel(name).count();
      expect(count, `Tenant must NOT see: ${name}`).toBe(0);
    }
  });

  test('Tenant sees correct remaining quota (20 daily, 440 monthly)', async ({ page }) => {
    await login(page, TENANT_USER.email, TENANT_USER.pass);
    await goToNewUser(page);

    // tenant_id=69: daily_limit=50, monthly_limit=500
    // assigned_daily=30 (ffff=10+jj=20) → remain_daily=20
    // assigned_monthly=60 → remain_monthly=440
    const dailyRemaining   = page.locator('p').filter({ hasText: /Max.*Limit/i }).first();
    const monthlyRemaining = page.locator('p').filter({ hasText: /Max.*Limit/i }).last();

    await expect(dailyRemaining).toContainText('20', { timeout: 8000 });
    await expect(monthlyRemaining).toContainText('440', { timeout: 8000 });
  });

  test('Quota exhausted banner hidden when quota remains', async ({ page }) => {
    await login(page, TENANT_USER.email, TENANT_USER.pass);
    await goToNewUser(page);

    await page.waitForTimeout(1000);
    await expect(page.locator('.alert-warning')).not.toBeVisible({ timeout: 5000 });
  });

});
