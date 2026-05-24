import { test, expect, request as pwRequest } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'http://66.42.114.181';
const API  = `${BASE}/api`;

// Dedicated lockout-test user — created/deleted in beforeAll/afterAll so
// triggering lockout (active=0) doesn't affect other test users
const LOCKOUT_EMAIL = 'lockout_e2e@ictpbx.test';
const LOCKOUT_PASS  = 'LockoutTest@1';

let adminToken = '';
let lockoutUserId = '';

test.describe('Auth Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    const r = await request.post(`${API}/authenticate`, {
      data: { username: 'admin@ictcore.org', password: 'helloAdmin' },
    });
    const d = await r.json();
    adminToken = d.token || d.data?.token || d.access_token || '';
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Clean up lockout user from prior run
    const usersResp = await request.get(`${API}/users`, { headers });
    if (usersResp.ok()) {
      const users: any[] = await usersResp.json();
      const existing = users.find((u: any) => u.email === LOCKOUT_EMAIL);
      if (existing) {
        await request.delete(`${API}/users/${existing.user_id ?? existing.usr_id}`, { headers }).catch(() => {});
        await new Promise(res => setTimeout(res, 300));
      }
    }

    // Create lockout test user under tenant 143
    const cr = await request.post(`${API}/users`, {
      headers,
      data: {
        email: LOCKOUT_EMAIL, password: LOCKOUT_PASS,
        first_name: 'Lockout', last_name: 'E2E',
        tenant_id: 143, role_id: 4, active: 1,
      },
    });
    if (cr.ok()) {
      const cd = await cr.json();
      lockoutUserId = String(typeof cd === 'string' || typeof cd === 'number' ? cd : (cd.user_id ?? cd.usr_id ?? cd.data?.user_id ?? ''));
      // Activate if needed (ICTCore defaults to active=0)
      if (lockoutUserId) {
        await request.put(`${API}/users/${lockoutUserId}`, {
          headers, data: { active: 1 },
        }).catch(() => {});
      }
    }
  });

  test.afterAll(async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    if (lockoutUserId) {
      await request.delete(`${API}/users/${lockoutUserId}`, { headers }).catch(() => {});
    }
  });

  test('wrong password returns 401 not 500', async ({ request }) => {
    const r = await request.post(`${API}/authenticate`, {
      data: { username: 'admin@ictcore.org', password: 'wrong_password_xyz' },
    });
    expect(r.status()).toBe(401);
    const body = await r.text();
    expect(body).not.toContain('Call to a member function');
    expect(body).not.toContain('Fatal error');
  });

  test('unknown user returns 4xx', async ({ request }) => {
    const r = await request.post(`${API}/authenticate`, {
      data: { username: 'nobody@nonexistent.invalid', password: 'anything' },
    });
    expect(r.status()).toBeGreaterThanOrEqual(400);
    expect(r.status()).toBeLessThan(500);
  });

  test('empty credentials return 4xx', async ({ request }) => {
    const r = await request.post(`${API}/authenticate`, { data: {} });
    expect(r.status()).toBeGreaterThanOrEqual(400);
    expect(r.status()).toBeLessThan(500);
  });

  test('valid login JWT uses RS256', async ({ request }) => {
    const r = await request.post(`${API}/authenticate`, {
      data: { username: 'admin@ictcore.org', password: 'helloAdmin' },
    });
    expect(r.ok()).toBeTruthy();
    const d = await r.json();
    const token: string = d.token || d.data?.token || d.access_token || '';
    expect(token.length).toBeGreaterThan(10);
    const parts = token.split('.');
    expect(parts.length).toBe(3);
    const headerJson = Buffer.from(parts[0], 'base64').toString('utf-8');
    const header = JSON.parse(headerJson);
    expect(header.alg).toBe('RS256');
  });

  test('JWT expiry is in the future', async ({ request }) => {
    const r = await request.post(`${API}/authenticate`, {
      data: { username: 'admin@ictcore.org', password: 'helloAdmin' },
    });
    const d = await r.json();
    const token: string = d.token || d.data?.token || d.access_token || '';
    const parts = token.split('.');
    const pad = (s: string) => s + '='.repeat((4 - s.length % 4) % 4);
    const payloadJson = Buffer.from(pad(parts[1]), 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });

  test('forged token returns 401', async ({ request }) => {
    const r = await request.get(`${API}/users`, {
      headers: { Authorization: 'Bearer forged.token.xyz' },
    });
    expect(r.status()).toBe(401);
  });

  test('unauthenticated request returns 401', async ({ request }) => {
    const r = await request.get(`${API}/users`);
    expect(r.status()).toBe(401);
  });

  test('login form shows error on wrong password', async ({ page }) => {
    await page.goto(`${BASE}/#/auth/login`);
    await page.waitForSelector('#input-email', { timeout: 20000 });
    await page.fill('#input-email', 'admin@ictcore.org');
    await page.fill('#input-password', 'definitely_wrong_pass');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('.alert-danger, nb-alert').first()).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('repeated wrong logins trigger lockout or consistent 401', async ({ request }) => {
    // Uses dedicated lockout_e2e user — not shared with other specs
    test.skip(!lockoutUserId, 'Lockout test user not created');
    let gotLockout = false;
    for (let i = 0; i < 10; i++) {
      const r = await request.post(`${API}/authenticate`, {
        data: { username: LOCKOUT_EMAIL, password: `bad_pass_${i}` },
      });
      if (r.status() === 423 || r.status() === 429) {
        gotLockout = true;
        break;
      }
      expect(r.status()).toBeGreaterThanOrEqual(400);
      expect(r.status()).toBeLessThan(500);
    }
    if (gotLockout) {
      console.log('Lockout triggered as expected.');
    } else {
      console.warn('10 wrong logins did not trigger lockout — policy may require more attempts.');
    }
    // afterAll deletes the user entirely — no need to reset active flag
  });
});
